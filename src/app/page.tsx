'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Input, Button, Spinner } from '@heroui/react';
import Image from 'next/image';

interface WeatherData {
  temp: string;
  condition: string;
  humidity: number;
  windSpeed: string;
  windDirection: string;
  detailedForecast: string;
  isDaytime: boolean;
  name: string;
  icon: string;
}

interface Coordinates {
  lat: number;
  lon: number;
}

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    className="w-5 h-5 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export default function Home() {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  const getWeatherByCoordinates = async (coords: Coordinates) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }
      const data = await response.json();
      setWeatherData(data.weather);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setError(null);
    setCity('');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      setIsUsingCurrentLocation(true);
      await getWeatherByCoordinates({
        lat: position.coords.latitude,
        lon: position.coords.longitude
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setWeatherData(null);
      setIsUsingCurrentLocation(false);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setError(null);
    setIsUsingCurrentLocation(false);

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }
      const data = await response.json();
      setWeatherData(data.weather);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-8 bg-[url('/anime-pattern.png')] bg-opacity-[0.02]">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Weather
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-light tracking-wide">
            Simple forecast
          </p>
        </div>

        <Card className="backdrop-blur-md bg-white/80 dark:bg-black/50 shadow-2xl border-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/anime-dots.png')] opacity-[0.02]"></div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-6 relative">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Enter city, ZIP code, or landmark"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 bg-gray-50/50 dark:bg-gray-900/50"
                    classNames={{
                      input: "text-base sm:text-lg pl-12 pr-4 py-3 text-gray-900 dark:text-gray-100 font-light",
                      inputWrapper: "shadow-sm backdrop-blur-sm h-auto rounded-none border border-gray-200 dark:border-gray-800"
                    }}
                    aria-label="Location input"
                    disabled={locationLoading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <SearchIcon />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  variant="solid"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white shadow-md px-6 py-3 h-auto rounded-none w-full sm:w-auto transition-all duration-200"
                  disabled={loading || locationLoading}
                >
                  {loading ? "..." : 'Search'}
                </Button>
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="text-sm text-gray-500 dark:text-gray-400 font-light">
                  <p>Examples:</p>
                  <p>• City: Modesto, CA</p>
                  <p>• ZIP: 83204</p>
                  <p>• Landmark: Lincoln Park, Los Angeles, CA</p>
                </div>
                {(loading || locationLoading) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 font-light">
                    <Spinner className="w-3 h-3 text-current" />
                    {locationLoading ? 'Getting location...' : 'Searching weather...'}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isUsingCurrentLocation ? "solid" : "ghost"}
                onClick={handleGetLocation}
                disabled={loading || locationLoading}
                className={`px-6 py-3 rounded-none flex items-center justify-center gap-2 w-full sm:w-auto transition-all duration-200 ${isUsingCurrentLocation 
                  ? "bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white shadow-md" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800"}`}
              >
                {locationLoading ? (
                  <Spinner className="w-4 h-4 text-current" />
                ) : (
                  <>
                    {isUsingCurrentLocation ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span>Using Current Location</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>Use My Location</span>
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {error && (
          <Card className="backdrop-blur-md bg-white/80 dark:bg-black/50 shadow-2xl border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/anime-dots.png')] opacity-[0.02]"></div>
            <div className="p-6 relative">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-none bg-red-50 dark:bg-red-900/20">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-red-600 dark:text-red-400">
                    An error occurred
                  </h3>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 font-light">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {weatherData && (
          <Card className="backdrop-blur-md bg-white/80 dark:bg-black/50 shadow-2xl border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/anime-dots.png')] opacity-[0.02]"></div>
            <div className="space-y-6 p-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {weatherData.temp}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-lg font-light">{weatherData.name}</p>
                </div>
                {weatherData.icon && (
                  <div className="p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-none">
          <Image
                      src={weatherData.icon}
                      alt={weatherData.condition}
                      width={75}
                      height={75}
                      className="transform scale-110"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-none border border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Condition</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{weatherData.condition}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-none border border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Humidity</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{weatherData.humidity}%</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-none border border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Wind Speed</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{weatherData.windSpeed}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-none border border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Wind Direction</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{weatherData.windDirection}</p>
                </div>
              </div>

              <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-none border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-light">Detailed Forecast</p>
                <p className="mt-2 text-gray-900 dark:text-gray-100 leading-relaxed font-light">
                  {weatherData.detailedForecast}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Support and GitHub section */}
        <div className="text-center pt-8 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://moikas.com/discount/moikapy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              Support the Developer
            </a>
            <a
              href="https://github.com/Moikapy/vibe-code-weather-app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              View on GitHub
            </a>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Help improve this project by contributing on GitHub
          </p>
        </div>
      </div>
    </main>
  );
}
