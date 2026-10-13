'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth, homeFor } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';

/** Google sign-in for customers. Hidden automatically if NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. */
export default function GoogleButton({ next, text = 'continue_with' }) {
  const { googleLogin } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex justify-center [&>div]:w-full">
      <GoogleLogin
        text={text}
        shape="rectangular"
        size="large"
        width="360"
        theme={resolvedTheme === 'dark' ? 'filled_black' : 'outline'}
        onSuccess={async ({ credential }) => {
          try {
            const data = await googleLogin(credential);
            toast.success(`Welcome, ${data.user.name.split(' ')[0]}!`);
            router.replace(data.needsWhatsapp ? '/complete-profile' : homeFor(data.user, next));
          } catch (err) {
            toast.error(getErrorMessage(err));
          }
        }}
        onError={() => toast.error('Google sign-in was cancelled or failed')}
      />
    </div>
  );
}
