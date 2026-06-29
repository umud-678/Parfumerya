export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Təhlükəsizlik</h1>
      <div className="card-admin max-w-lg space-y-6">
        <div>
          <h2 className="text-mint-400 text-sm mb-3">Şifrə dəyişmə</h2>
          <input type="password" placeholder="Cari şifrə" className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm mb-3 outline-none" />
          <input type="password" placeholder="Yeni şifrə" className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm mb-3 outline-none" />
          <button className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold">Yenilə</button>
        </div>
        <div>
          <h2 className="text-mint-400 text-sm mb-3">Rol icazələri</h2>
          <p className="text-white/60 text-sm">Baş admin — tam icazə</p>
          <p className="text-white/60 text-sm">Admin — məhsul, sifariş, hesabat</p>
          <p className="text-white/60 text-sm">Müştəri — yalnız müştəri tərəfi</p>
        </div>
      </div>
    </div>
  );
}
