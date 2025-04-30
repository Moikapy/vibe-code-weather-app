import { NextResponse } from 'next/server';

// Geocoding function
async function geocodeCity(location: string) {
  try {
    // Check if input is a ZIP code (5 digits)
    const isZipCode = /^\d{5}$/.test(location);
    
    // Check if input is a city, state format (e.g., "Seattle, WA")
    const isCityState = /^[A-Za-z\s-]+,\s*[A-Z]{2}$/.test(location);
    
    // For ZIP codes, use a different format in the geocoding URL
    let geocodeUrl;
    if (isZipCode) {
      geocodeUrl = `https://geocode.xyz/${location}?region=US&json=1&auth=${process.env.GEOCODE_API_KEY}`;
    } else if (isCityState) {
      // For city,state format, add region=US to ensure US-based search
      geocodeUrl = `https://geocode.xyz/${encodeURIComponent(location)},US?region=US&json=1&auth=${process.env.GEOCODE_API_KEY}`;
    } else {
      // For landmarks, parks, and cities, use the full search capability
      geocodeUrl = `https://geocode.xyz/${encodeURIComponent(location)},United States?region=US&json=1&auth=${process.env.GEOCODE_API_KEY}&fuzzy=1`;
    }

    const response = await fetch(geocodeUrl, { 
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.description || 'Location not found');
    }

    // Validate coordinates
    const lat = parseFloat(data.latt);
    const lon = parseFloat(data.longt);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Location not found. Please check your input and try again.');
    }

    // For non-ZIP code searches, do a basic US boundary check instead of relying on country name
    if (!isZipCode) {
      // Check if coordinates are roughly within US bounds (including Alaska and Hawaii)
      // Continental US: lat 24.396308 to 49.384358, lon -125.000000 to -66.934570
      // Alaska: lat 51.214183 to 71.538800, lon -179.148909 to -130.001897
      // Hawaii: lat 18.910361 to 28.402123, lon -178.334698 to -154.806773
      const isInContinentalUS = (
        lat >= 24.396308 && lat <= 49.384358 &&
        lon >= -125.000000 && lon <= -66.934570
      );
      const isInAlaska = (
        lat >= 51.214183 && lat <= 71.538800 &&
        lon >= -179.148909 && lon <= -130.001897
      );
      const isInHawaii = (
        lat >= 18.910361 && lat <= 28.402123 &&
        lon >= -178.334698 && lon <= -154.806773
      );

      if (!isInContinentalUS && !isInAlaska && !isInHawaii) {
        throw new Error('Location must be within the United States (including Alaska and Hawaii)');
      }
    }

    // Construct location name, handling city,state format specially
    let locationName;
    if (isCityState) {
      locationName = location; // Keep original city,state format
    } else if (data.standard?.city) {
      locationName = `${data.standard.city}${data.standard.prov ? `, ${data.standard.prov}` : ''}`;
    } else {
      locationName = location;
    }

    return {
      lat,
      lon,
      locationName
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Location not found. Please enter a valid US location (city, ZIP code, or landmark)');
  }
}

interface NWSForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: "F" | "C";
  temperatureTrend: string | null;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  relativeHumidity: {
    value: number;
    unitCode: string;
  };
}

// Weather data fetching function
async function getWeatherData(lat: number, lon: number) {
  try {
    // First, get the forecast URL and station from the points endpoint
    console.log(`Fetching points data for coordinates: ${lat},${lon}`);
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`,
      {
        headers: {
          'User-Agent': process.env.NEXT_PUBLIC_NWS_USER_AGENT || 'WeatherApp (contact@example.com)',
          'Accept': 'application/geo+json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!pointsResponse.ok) {
      console.error('Points API Error:', {
        status: pointsResponse.status,
        statusText: pointsResponse.statusText,
        url: pointsResponse.url
      });
      throw new Error(`Failed to fetch points data: ${pointsResponse.statusText}`);
    }

    const pointsData = await pointsResponse.json();
    console.log('Points data received:', {
      forecast: pointsData.properties?.forecast,
      gridId: pointsData.properties?.gridId,
      gridX: pointsData.properties?.gridX,
      gridY: pointsData.properties?.gridY
    });

    if (!pointsData.properties?.forecast) {
      throw new Error('No forecast data available for this location');
    }

    // Get the forecast data
    console.log('Fetching forecast data from:', pointsData.properties.forecast);
    const forecastResponse = await fetch(pointsData.properties.forecast, {
      headers: {
        'User-Agent': process.env.NEXT_PUBLIC_NWS_USER_AGENT || 'WeatherApp (contact@example.com)',
        'Accept': 'application/geo+json'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!forecastResponse.ok) {
      console.error('Forecast API Error:', {
        status: forecastResponse.status,
        statusText: forecastResponse.statusText,
        url: forecastResponse.url
      });
      throw new Error(`Failed to fetch forecast data: ${forecastResponse.statusText}`);
    }

    const forecastData = await forecastResponse.json();
    const currentPeriod = forecastData.properties.periods[0] as NWSForecastPeriod;

    if (!currentPeriod) {
      throw new Error('No forecast period data available');
    }

    // Get the nearest observation station
    const stationsResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lon}/stations`,
      {
        headers: {
          'User-Agent': process.env.NEXT_PUBLIC_NWS_USER_AGENT || 'WeatherApp (contact@example.com)',
          'Accept': 'application/geo+json'
        },
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!stationsResponse.ok) {
      throw new Error(`Failed to fetch stations data: ${stationsResponse.statusText}`);
    }

    const stationsData = await stationsResponse.json();
    const nearestStation = stationsData.features[0];

    if (!nearestStation) {
      throw new Error('No weather stations found nearby');
    }

    // Get the latest observations from the nearest station
    const observationsResponse = await fetch(
      nearestStation.id + '/observations/latest',
      {
        headers: {
          'User-Agent': process.env.NEXT_PUBLIC_NWS_USER_AGENT || 'WeatherApp (contact@example.com)',
          'Accept': 'application/geo+json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!observationsResponse.ok) {
      throw new Error(`Failed to fetch observations data: ${observationsResponse.statusText}`);
    }

    const observationsData = await observationsResponse.json();
    const relativeHumidity = observationsData.properties.relativeHumidity.value;

    return {
      temperature: currentPeriod.temperature,
      temperatureUnit: currentPeriod.temperatureUnit,
      shortForecast: currentPeriod.shortForecast,
      detailedForecast: currentPeriod.detailedForecast,
      windSpeed: currentPeriod.windSpeed,
      windDirection: currentPeriod.windDirection,
      relativeHumidity: relativeHumidity ? Math.round(relativeHumidity) : null,
      name: currentPeriod.name,
      isDaytime: currentPeriod.isDaytime,
      icon: currentPeriod.icon
    };
  } catch (error) {
    console.error('Weather data fetch error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('city');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!location && (!lat || !lon)) {
    return NextResponse.json(
      { error: 'Please provide a location (city, ZIP code, or landmark) or coordinates' },
      { status: 400 }
    );
  }

  try {
    let coords;
    let locationName;
    
    if (lat && lon) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      
      // Validate coordinate ranges
      if (isNaN(latitude) || isNaN(longitude) || 
          latitude < 24.396308 || latitude > 49.384358 ||  // Approximate US latitude bounds
          longitude < -125.000000 || longitude > -66.934570) {  // Approximate US longitude bounds
        throw new Error('Location must be within the United States');
      }
      
      coords = { lat: latitude, lon: longitude };
      // Reverse geocode to get city, state
      let resolvedName = null;
      try {
        const reverseGeocodeUrl = `https://geocode.xyz/${latitude},${longitude}?geoit=json&auth=${process.env.GEOCODE_API_KEY}`;
        const reverseRes = await fetch(reverseGeocodeUrl, { next: { revalidate: 3600 } });
        const reverseData = await reverseRes.json();
        if (reverseData.error) throw new Error(reverseData.error.description);
        if (reverseData.city && reverseData.state) {
          resolvedName = `${reverseData.city}, ${reverseData.state}`;
        } else if (reverseData.city) {
          resolvedName = reverseData.city;
        } else {
          resolvedName = 'Current Location';
        }
      } catch {
        resolvedName = 'Current Location';
      }
      locationName = resolvedName;
    } else if (location) {
      const geoResult = await geocodeCity(location);
      coords = { lat: geoResult.lat, lon: geoResult.lon };
      locationName = geoResult.locationName;
      
      // Validate the geocoded coordinates are within US bounds
      if (coords.lat < 24.396308 || coords.lat > 49.384358 ||
          coords.lon < -125.000000 || coords.lon > -66.934570) {
        throw new Error('Location must be within the United States');
      }
    } else {
      throw new Error('Invalid parameters');
    }
    
    // Get weather data
    const weatherData = await getWeatherData(coords.lat, coords.lon);

    return NextResponse.json({
      location: locationName,
      coordinates: coords,
      weather: {
        temp: `${weatherData.temperature}°${weatherData.temperatureUnit}`,
        condition: weatherData.shortForecast,
        humidity: weatherData.relativeHumidity || 'N/A',
        windSpeed: weatherData.windSpeed,
        windDirection: weatherData.windDirection,
        detailedForecast: weatherData.detailedForecast,
        isDaytime: weatherData.isDaytime,
        name: weatherData.name,
        icon: weatherData.icon
      }
    });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
} 