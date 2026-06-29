import { formatPaymentMethod } from '../utils/azLabels';

export default function PaymentsPage() {
  const methods = [
    { name: 'Bank kartı', code: 'card', active: true },
    { name: 'Nağd', code: 'cash', active: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Ödəniş sistemləri</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        {methods.map((m) => (
          <div key={m.code} className="card-admin">
            <p className="font-medium">{m.name}</p>
            <p className="text-white/40 text-sm">{formatPaymentMethod(m.code)}</p>
            <span className="inline-block mt-3 text-xs text-mint-400 bg-mint-400/10 px-2 py-1 rounded">Aktiv</span>
          </div>
        ))}
      </div>
      <p className="text-white/40 text-sm">Kart məlumatları birbaşa bank sistemə yönləndirilir. Verilənlər bazasında saxlanılmır.</p>
    </div>
  );
}
