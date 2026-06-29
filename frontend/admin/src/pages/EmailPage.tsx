export default function EmailPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">E-poçt / SMS</h1>
      <div className="card-admin max-w-lg space-y-4">
        <select className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm">
          <option>Sifariş təsdiqi</option>
          <option>Endirim mesajı</option>
          <option>Fərdi mesaj</option>
        </select>
        <textarea placeholder="Mesaj mətni..." rows={4} className="w-full bg-plum-950 border border-plum-700 rounded-xl px-4 py-3 text-sm outline-none" />
        <button className="bg-mint-400 text-plum-900 px-6 py-2.5 rounded-full text-sm font-semibold">Göndər</button>
      </div>
    </div>
  );
}
