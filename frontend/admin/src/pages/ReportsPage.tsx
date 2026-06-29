export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Hesabatlar</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-admin">
          <h2 className="text-mint-400 mb-4">Günlük satış</h2>
          <p className="text-3xl font-bold">₼ 1,240</p>
        </div>
        <div className="card-admin">
          <h2 className="text-mint-400 mb-4">Aylıq satış</h2>
          <p className="text-3xl font-bold">₼ 24,580</p>
        </div>
        <div className="card-admin md:col-span-2">
          <h2 className="text-mint-400 mb-4">Gəlir analizi (30 gün)</h2>
          <div className="h-40 flex items-end gap-2">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 bg-mint-400/30 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
