import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { RegistrationService } from '../services/registrationService';
import { supabase } from '../lib/supabase';

interface RegisterAuthProps {
  mode?: 'register' | 'signin';
  onBack?: () => void;
}

const RegisterAuth: React.FC<RegisterAuthProps> = ({ mode = 'register', onBack }) => {
  const navigate = useNavigate();

  const debug = (...args: any[]) => {
    if (import.meta.env?.MODE !== 'production') {
      console.log('[RegisterAuth]', ...args);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (data.session) {
          if (mode === 'signin') {
            navigate('/universe-selection', { replace: true });
          } else {
            navigate('/register/onboarding/step/0', { replace: true });
          }
        }
      } catch {
        // ignore
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [mode, navigate]);

  const handleSignUp = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      const result = await RegistrationService.createAuthUser(email, password);
      if (!result.success) {
        setError(result.error || 'Sign up failed');
        return;
      }

      if (!result.sessionCreated) {
        setMessage('Account created. Please verify your email using the link we sent, then sign in below to continue.');
      } else {
        setMessage('Account created and signed in. Redirecting to onboarding...');
        navigate('/register/onboarding/step/0', { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      const result = await RegistrationService.resendConfirmationEmail(email);
      if (!result.success) {
        setError(result.error || 'Failed to resend verification email');
        return;
      }

      setMessage('Verification email resent. Please check your inbox (and spam/junk folder).');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resend verification email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      setMessage(null);

      const result = await RegistrationService.signIn(email, password);
      if (!result.success) {
        setError(result.error || 'Sign in failed');
        return;
      }

      const signedInUserId = result.userId;

      // Universal onboarding gate on sign-in: decide where to send the user based on DB state.
      // This keeps behavior consistent across devices/sessions.
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('id, onboarding_skipped')
          .eq('id', signedInUserId)
          .maybeSingle();

        if (profileErr) {
          debug('profiles read error', profileErr);
          throw profileErr;
        }

        const skipped = !!profile?.onboarding_skipped;

        debug('profiles read ok', { hasProfile: !!profile, skipped });

        const [interestsRes, prefsRes] = await Promise.all([
          supabase.from('user_interests').select('user_id').eq('user_id', signedInUserId).maybeSingle(),
          supabase.from('user_preferences').select('user_id').eq('user_id', signedInUserId).maybeSingle(),
        ]);

        if (interestsRes.error) {
          debug('user_interests read error', interestsRes.error);
          throw interestsRes.error;
        }
        if (prefsRes.error) {
          debug('user_preferences read error', prefsRes.error);
          throw prefsRes.error;
        }

        const completed = skipped || (!!interestsRes.data && !!prefsRes.data);

        debug('completion computed', { completed, hasInterests: !!interestsRes.data, hasPrefs: !!prefsRes.data });

        setMessage('Signed in. Redirecting...');
        navigate(completed ? '/universe-selection' : '/register/onboarding/step/0', { replace: true });
      } catch {
        // If we can't read onboarding state, be safe and send them to onboarding.
        setMessage('Signed in. Redirecting...');
        navigate('/register/onboarding/step/0', { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Start with your email</h2>
            <p className="text-gray-600">{mode === 'signin' ? 'Enter your credentials to continue.' : 'You’ll verify your email, then continue onboarding step-by-step.'}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Create a password"
              />
            </div>

            {error && (
              <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-700 text-sm">{message}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-3">
              {mode === 'signin' ? (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isSubmitting}
                  className="w-full px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:from-indigo-600 hover:to-pink-600 shadow-lg"
                >
                  Sign in
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={isSubmitting}
                    className="w-full px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:from-indigo-600 hover:to-pink-600 shadow-lg"
                  >
                    Sign up
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                    >
                      Resend verification
                    </button>

                    <button
                      type="button"
                      onClick={handleSignIn}
                      disabled={isSubmitting}
                      className="px-6 py-3 rounded-xl font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm"
                    >
                      I verified — Sign in
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterAuth;
