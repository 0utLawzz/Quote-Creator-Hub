import { useEffect } from 'react';
import { useLocation } from 'wouter';

export function useTheme() {
  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
}
