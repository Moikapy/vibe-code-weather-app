import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moikas Weather App - Beautiful Weather Forecasts',
  description: 'Get accurate, real-time weather forecasts with a beautiful, modern interface. Features current conditions, detailed forecasts, and location-based weather for US cities, ZIP codes, and landmarks.',
  keywords: 'weather app, weather forecast, US weather, real-time weather, weather conditions, weather API, location-based weather, weather dashboard, Moikas weather',
  authors: [{ name: 'Moikapy', url: 'https://moikas.com' }],
  openGraph: {
    title: 'Moikas Weather App - Beautiful Weather Forecasts',
    description: 'Get accurate, real-time weather forecasts with a beautiful, modern interface. Features current conditions, detailed forecasts, and location-based weather.',
    url: 'https://weather.moikas.com',
    siteName: 'Moikas Weather App',
    images: [
      {
        url: '/weather-app-preview.png',
        width: 1200,
        height: 630,
        alt: 'Moikas Weather App Preview'
      }
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moikas Weather App - Beautiful Weather Forecasts',
    description: 'Get accurate, real-time weather forecasts with a beautiful, modern interface.',
    images: ['/weather-app-preview.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification_token',
  },
}; 