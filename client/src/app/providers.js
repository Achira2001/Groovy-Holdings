'use client';

import { ThemeProvider } from 'next-themes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import VisitTracker from '@/components/shared/VisitTracker';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function Providers({ children }) {
  const tree = (
    <AuthProvider>
      <SocketProvider>
        {children}
        <VisitTracker />
        <Toaster
          position="top-right"
          toastOptions={{
            className: '!bg-surface !text-ink !border !border-line !rounded-xl !shadow-pop !text-sm',
            success: { iconTheme: { primary: 'rgb(var(--success))', secondary: '#fff' } },
            error: { iconTheme: { primary: 'rgb(var(--danger))', secondary: '#fff' } },
          }}
        />
      </SocketProvider>
    </AuthProvider>
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{tree}</GoogleOAuthProvider> : tree}
    </ThemeProvider>
  );
}
