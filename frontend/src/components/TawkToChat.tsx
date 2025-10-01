"use client";
import { useEffect } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

const TawkToChat = () => {
  useEffect(() => {
    // Initialize Tawk.to if not already loaded
    if (!window.Tawk_API) {
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://embed.tawk.to/68d856c68b3ee61953e1cbee/default';
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');

      // Find the first script tag and insert before it
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        // Fallback: append to head
        document.head.appendChild(script);
      }

      // Clean up function
      return () => {
        // Remove the script when component unmounts (optional)
        const tawkScript = document.querySelector('script[src*="embed.tawk.to"]');
        if (tawkScript) {
          tawkScript.remove();
        }
      };
    }
  }, []);

  return null; // This component doesn't render anything visible
};

export default TawkToChat;