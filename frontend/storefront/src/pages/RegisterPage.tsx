import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { store } from '../store/store';
import { setUser } from '../store/authSlice';
import { resendRegisterOtp, sendRegisterOtp, verifyRegisterOtp } from '../services/auth';
import { syncWishlistAfterAuth } from '../services/wishlist';

type Step = 'form' | 'otp';

function validatePasswordClient(password: string, t: (key: string) => string): string | null {
  if (password.length < 8) return t('auth.passwordMin');
  if (!/[A-Z]/.test(password)) return t('auth.passwordUppercase');
  return null;
}

export default function RegisterPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
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
      await sendRegisterOtp(firstName.trim(), lastName.trim(), email.trim(), password);
      setStep('otp');
      setOtp('');
      setResendIn(60);
      setInfo(t('auth.otpSent', { email: email.trim().toLowerCase() }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.registerError');
      setError(message);
      const match = message.match(/(\d+)\s+saniyə/);
      if (match) setResendIn(Number(match[1]));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const user = await verifyRegisterOtp(email.trim().toLowerCase(), otp.trim());
      dispatch(setUser(user));
      await syncWishlistAfterAuth(dispatch, store.getState().wishlist.items);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerError'));
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
      await resendRegisterOtp(email.trim().toLowerCase());
      setResendIn(60);
      setInfo(t('auth.otpResent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-6">
      <div className="card-elegant p-10 w-full max-w-md relative">
        <div className="text-center mb-8">
          <span className="text-2xl text-mint-400/40">✿</span>
          <h1 className="font-serif text-3xl text-mint-400 mt-2">{t('auth.register')}</h1>
          {step === 'otp' && (
            <p className="text-white/45 text-sm mt-2">{t('auth.otpStepHint')}</p>
          )}
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t('auth.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
                className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
              />
              <input
                type="text"
                placeholder={t('auth.lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
                className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
              />
            </div>
            <input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-plum-900/80 border border-plum-700 rounded-xl px-4 py-3 outline-none focus:border-mint-400/50"
            />
            <input
              type="password"
              placeholder={t('auth.passwordHint')}
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
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 disabled:opacity-60">
              {loading ? t('auth.sendingOtp') : t('auth.continueWithOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
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
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn-primary py-3 disabled:opacity-60">
              {loading ? t('auth.verifyingOtp') : t('auth.verifyAndRegister')}
            </button>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
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
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="text-mint-400 hover:underline">{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
