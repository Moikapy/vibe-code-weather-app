'use client';

import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Show prompt for iOS devices
    if (isIOSDevice) {
      // Check if the app is not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  return isIOS ? (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 text-white text-center">
      <p className="text-sm">
        Install this app on your iPhone: tap
        <svg
          className="w-5 h-5 inline-block mx-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
        </svg>
        then "Add to Home Screen"
      </p>
    </div>
  ) : null;
} 