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
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Click &ldquo;Install&rdquo; to add this app to your home screen
      </p>
    </div>
  ) : null;
} 