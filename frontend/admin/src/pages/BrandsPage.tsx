import { Plus } from 'lucide-react';

const brands = ['Dior', 'Chanel', 'Tom Ford'];

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-serif text-3xl text-mint-400">Brend idarəsi</h1>
        <button className="flex items-center gap-2 bg-mint-400 text-plum-900 px-5 py-2.5 rounded-full text-sm font-semibold">
          <Plus size={16} /> Brend əlavə et
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {brands.map((b) => (
          <div key={b} className="card-admin text-center">
            <p className="font-serif text-lg">{b}</p>
            <div className="flex justify-center gap-3 mt-4 text-sm">
              <button className="text-mint-400">Redaktə</button>
              <button className="text-white/40 hover:text-red-400">Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
