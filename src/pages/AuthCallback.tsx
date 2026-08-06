import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase puts auth tokens in the URL hash fragment after email verification.
        // The JS client auto-detects and exchanges them when we call getSession().
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus('success');
          // Brief pause so the user sees the success state
          setTimeout(() => {
            try {
              const pendingChatRaw = localStorage.getItem('pending_guest_chat');
              if (pendingChatRaw) {
                const pendingChat = JSON.parse(pendingChatRaw);
                if (pendingChat?.needsProfileComplete) {
                  navigate('/complete-profile', { replace: true });
                  return;
                }
              }
            } catch (e) {}
            navigate('/', { replace: true });
          }, 1500);
        } else {
          // No session yet — the hash tokens might still be processing.
          // Listen for the auth state change event instead.
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === 'SIGNED_IN' && session) {
                setStatus('success');
                setTimeout(() => {
                  try {
                    const pendingChatRaw = localStorage.getItem('pending_guest_chat');
                    if (pendingChatRaw) {
                      const pendingChat = JSON.parse(pendingChatRaw);
                      if (pendingChat?.needsProfileComplete) {
                        navigate('/complete-profile', { replace: true });
                        return;
                      }
                    }
                  } catch (e) {}
                  navigate('/', { replace: true });
                }, 1500);
                subscription.unsubscribe();
              }
            }
          );

          // Timeout fallback — if nothing happens in 8 seconds, show error
          setTimeout(() => {
            setStatus((prev) => {
              if (prev === 'loading') {
                subscription.unsubscribe();
                setErrorMessage(
                  'Email verification timed out. The link may have expired — please try signing up again.'
                );
                return 'error';
              }
              return prev;
            });
          }, 8000);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'An error occurred during email verification.');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="h-[100dvh] flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying your email…</h1>
            <p className="text-muted-foreground text-sm">Please wait while we confirm your account.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
            <p className="text-muted-foreground text-sm">
              Your account is confirmed. Redirecting you now…
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
            <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
            <Button onClick={() => navigate('/auth', { replace: true })} className="w-full">
              Back to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
