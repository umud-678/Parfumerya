import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { setUser } from '../store/authSlice';
import {
  resendForgotPasswordOtp,
  resetPasswordWithOtp,
  sendForgotPasswordOtp,
} from '../services/auth';
import { syncWishlistAfterAuth } from '../services/wishlist';

type Step = 'email' | 'reset';

function validatePasswordClient(password: string, t: (key: string) => string): string | null {
  if (password.length < 8) return t('auth.passwordMin');
  if (!/[A-Z]/.test(password)) return t('auth.passwordUppercase');
  return null;
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await sendForgotPasswordOtp(email.trim().toLowerCase());
      setStep('reset');
      setOtp('');
      setResendIn(60);
      setInfo(t('auth.resetOtpSent', { email: email.trim().toLowerCase() }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.resetError');
      setError(message);
      const match = message.match(/(\d+)\s+saniyə/);
      if (match) setResendIn(Number(match[1]));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    const pwdError = validatePasswordClient(password, t);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    setLoading(true);
    try {
      const user = await resetPasswordWithOtp(email.trim().toLowerCase(), otp.trim(), password);
      dispatch(setUser(user));
      await syncWishlistAfterAuth(dispatch, store.getState().wishlist.items);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await resendForgotPasswordOtp(email.trim().toLowerCase());
      setResendIn(60);
      setInfo(t('auth.otpResent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-8 safe-bottom">
      <div className="card-elegant p-6 sm:p-10 w-full max-w-md relative">
        <div className="text-center mb-8">
          <span className="text-2xl text-mint-400/40">✿</span>
          <h1 className="font-serif text-3xl text-mint-400 mt-2">{t('auth.forgotPassword')}</h1>
          <p className="text-white/45 text-sm mt-2">
            {step === 'email' ? t('auth.forgotPasswordHint') : t('auth.resetOtpStepHint')}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
              {loading ? t('auth.sendingOtp') : t('auth.sendResetCode')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {info && <p className="text-mint-400/90 text-sm text-center">{info}</p>}
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder={t('auth.otpPlaceholder')}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoComplete="one-time-code"
              className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50 text-center text-2xl tracking-[0.4em] font-mono"
            />
            <input
              type="password"
              placeholder={t('auth.newPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
            />
            <input
              type="password"
              placeholder={t('auth.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
            />
            <p className="text-white/35 text-xs">{t('auth.passwordRules')}</p>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full btn-primary py-3 disabled:opacity-60"
            >
              {loading ? t('auth.resettingPassword') : t('auth.resetPassword')}
            </button>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setInfo('');
                }}
                className="text-white/50 hover:text-white"
              >
                {t('auth.backToForm')}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendIn > 0}
                className="text-mint-400 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resendIn > 0 ? t('auth.resendIn', { sec: resendIn }) : t('auth.resendOtp')}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-white/50 text-sm mt-6">
          <Link to="/login" className="text-mint-400 hover:underline">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
