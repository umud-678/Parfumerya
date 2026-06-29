export default function ShippingPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Çatdırılma</h1>
      <div className="card-admin space-y-4 max-w-lg">
        <div>
          <label className="text-white/40 text-sm">Bölgə</label>
          <p className="text-lg">Bakı</p>
        </div>
        <div>
          <label className="text-white/40 text-sm">Çatdırılma qiyməti</label>
          <p className="text-lg text-mint-400">₼ 5.00</p>
        </div>
        <div>
          <label className="text-white/40 text-sm">Pulsuz çatdırılma limiti</label>
          <p className="text-lg">₼ 100.00</p>
        </div>
      </div>
    </div>
  );
}
