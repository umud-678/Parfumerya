export default function ReviewsPage() {
  const reviews = [
    { product: 'Gül Ətri', user: 'Leyla M.', rating: 5, comment: 'Əla qoxu!', approved: false },
    { product: 'Sitron Təravəti', user: 'Rəşad K.', rating: 4, comment: 'Yaxşıdır', approved: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-mint-400">Rəylər</h1>
      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="card-admin">
            <div className="flex justify-between mb-2">
              <p className="font-medium">{r.product}</p>
              <span className="text-mint-400">{'★'.repeat(r.rating)}</span>
            </div>
            <p className="text-white/60 text-sm mb-3">{r.comment}</p>
            <p className="text-white/40 text-xs mb-3">{r.user}</p>
            <div className="flex gap-2">
              {!r.approved && <button className="text-xs bg-mint-400 text-plum-900 px-3 py-1 rounded-full">Təsdiqlə</button>}
              <button className="text-xs border border-plum-700 px-3 py-1 rounded-full">Gizlət</button>
              <button className="text-xs text-red-400/70 hover:text-red-400">Sil</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
