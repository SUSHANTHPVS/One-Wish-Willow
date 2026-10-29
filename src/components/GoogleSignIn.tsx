import { useEffect, useRef, useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { LogIn } from 'lucide-react';

interface GoogleSignInProps {
  onGoogleLogin: (credential: string, termsAccepted: boolean) => Promise<string | null>;
  theme: 'dark' | 'light';
  requireTerms?: boolean;
  termsAccepted?: boolean;
}

export default function GoogleSignIn({ onGoogleLogin, theme, requireTerms = false, termsAccepted = false }: GoogleSignInProps) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(200);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => {
      setWidth(Math.max(200, Math.min(360, Math.floor(entries[0].contentRect.width))));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const unavailable = !clientId || (requireTerms && !termsAccepted);
  return (
    <div className="google-sign-in" ref={container} aria-busy={busy}>
      {unavailable ? (
        <button
          className="google-sign-in-placeholder"
          type="button"
          disabled
          title={!clientId ? 'Google sign-in is not configured yet' : 'Accept the Terms and Conditions to continue with Google'}
        >
          <LogIn size={20} aria-hidden="true" />
          Continue with Google
        </button>
      ) : (
        <GoogleOAuthProvider clientId={clientId} onScriptLoadError={() => setError('Google sign-in could not load. Check your connection and try again.')}>
          <div className="google-sign-in-button" style={{ pointerEvents: busy ? 'none' : 'auto' }}>
            <GoogleLogin
              theme={theme === 'dark' ? 'filled_black' : 'outline'}
              size="large"
              shape="rectangular"
              text="continue_with"
              width={width}
              useOneTap={false}
              auto_select={false}
              onSuccess={async response => {
                if (busy) return;
                if (!response.credential) {
                  setError('Google did not return a sign-in credential. Please try again.');
                  return;
                }
                setError('');
                setBusy(true);
                try {
                  const failure = await onGoogleLogin(response.credential, termsAccepted);
                  if (failure) setError(failure);
                } catch {
                  setError('Unable to complete Google sign-in. Please try again.');
                } finally {
                  setBusy(false);
                }
              }}
              onError={() => setError('Google sign-in was not completed. Please try again.')}
            />
          </div>
        </GoogleOAuthProvider>
      )}
      {busy && <p role="status">Signing in...</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
    </div>
  );
}