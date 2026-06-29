import { isDeployMisconfigured } from '../config/env';

export default function DeployConfigGuard({ children }: { children: React.ReactNode }) {
  if (!isDeployMisconfigured()) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-plum-950 text-white">
      <div className="max-w-lg card-elegant p-8 text-center space-y-4">
        <h1 className="font-serif text-2xl text-mint-400">Deploy konfiqurasiyası</h1>
        <p className="text-white/60 text-sm leading-relaxed">
          Vercel-də <code className="text-mint-400">VITE_API_URL</code> environment variable təyin edilməyib.
          Render-də deploy etdiyiniz API ünvanını yazın.
        </p>
        <p className="text-white/40 text-xs">
          Nümunə: <code className="text-white/70">https://amoria-api.onrender.com/api</code>
        </p>
      </div>
    </div>
  );
}
