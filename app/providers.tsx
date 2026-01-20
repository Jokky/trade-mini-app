'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import '@telegram-apps/telegram-ui/dist/styles.css';

/**
 * Client-side provider component that wraps the application with TGUI AppRoot.
 * This component only renders on the client side to avoid SSR issues with Telegram UI.
 */
export function TelegramUIProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render children without AppRoot
  // This prevents the "Wrap your app with <AppRoot>" error during static generation
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AppRoot>
      {children}
    </AppRoot>
  );
}
