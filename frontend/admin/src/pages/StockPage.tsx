export default function StockPage() {
  const items = [
    { name: 'Meşə Gəzintisi', sku: 'MG-75', stock: 3, threshold: 5 },
    { name: 'Məxmər Qara', sku: 'MQ-50', stock: 8, threshold: 5 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Stok idarəsi</h1>
      <div className="card-admin overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 border-b border-plum-700/30">
              <th className="text-left py-3 px-2">Məhsul</th>
              <th className="text-left py-3 px-2">Məhsul kodu</th>
              <th className="text-left py-3 px-2">Stok</th>
              <th className="text-left py-3 px-2">Xəbərdarlıq</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.sku} className="border-b border-plum-700/20">
                <td className="py-3 px-2">{i.name}</td>
                <td className="py-3 px-2 text-white/40">{i.sku}</td>
                <td className={`py-3 px-2 ${i.stock <= i.threshold ? 'text-red-400' : 'text-mint-400'}`}>{i.stock}</td>
                <td className="py-3 px-2">{i.stock <= i.threshold ? '⚠️ Az stok' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
