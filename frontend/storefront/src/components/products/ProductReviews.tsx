import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import {
  getProductReviews,
  getReviewEligibility,
  submitReview,
  type ProductReview,
} from '../../services/reviews';

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5 text-gold-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rating ? 'fill-gold-400 text-gold-400' : 'text-white/20'}
        />
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={
              n <= (hover || value) ? 'fill-gold-400 text-gold-400' : 'text-white/25'
            }
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({
  productId,
  productSlug,
  onRatingUpdate,
}: {
  productId: string;
  productSlug: string;
  onRatingUpdate?: (averageRating: number | null, count: number) => void;
}) {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const locale = i18n.language?.split('-')[0] ?? 'az';

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      getProductReviews(productSlug),
      user ? getReviewEligibility(productSlug).catch(() => null) : Promise.resolve(null),
    ])
      .then(([data, eligibility]) => {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setCount(data.count);
        onRatingUpdate?.(data.averageRating, data.count);
        if (eligibility) {
          setCanReview(eligibility.canReview);
          setAlreadyReviewed(eligibility.alreadyReviewed);
        }
      })
      .catch(() => {
        setReviews([]);
        setCount(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [productSlug, user?.userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSubmitting(true);
    try {
      await submitReview({ productId, rating, comment: comment.trim() });
      setComment('');
      setRating(5);
      setSuccess(true);
      setCanReview(false);
      setAlreadyReviewed(true);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reviews.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-white/10 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-gold-300">{t('reviews.title')}</h2>
          {count > 0 && averageRating != null && (
            <div className="flex items-center gap-3 mt-2">
              <StarRow rating={Math.round(averageRating)} size={18} />
              <span className="text-white/60 text-sm">
                {averageRating.toFixed(1)} · {t('reviews.count', { count })}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-white/40">{t('reviews.loading')}</p>
      ) : (
        <>
          {user && canReview && (
            <form
              onSubmit={handleSubmit}
              className="card-elegant p-6 md:p-8 mb-8 border border-gold-400/15"
            >
              <h3 className="font-serif text-lg text-gold-300 mb-4">{t('reviews.writeTitle')}</h3>
              <p className="text-white/50 text-sm mb-4">{t('reviews.writeHint')}</p>
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
                placeholder={t('reviews.placeholder')}
                className="mt-4 w-full rounded-2xl bg-plum-900/50 border border-white/10 px-4 py-3 text-sm focus:border-gold-400/40 outline-none resize-none"
              />
              {error && <p className="text-red-400/80 text-sm mt-2">{error}</p>}
              {success && (
                <p className="text-accent text-sm mt-2">{t('reviews.thankYou')}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="btn-primary mt-4 px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {submitting ? t('reviews.submitting') : t('reviews.submit')}
              </button>
            </form>
          )}

          {!user && (
            <p className="text-white/50 text-sm mb-6">
              {t('reviews.loginToReview')}{' '}
              <Link to="/login" state={{ from: `/product/${productSlug}` }} className="text-gold-400 hover:underline">
                {t('auth.login')}
              </Link>
            </p>
          )}

          {user && alreadyReviewed && !canReview && (
            <p className="text-accent/70 text-sm mb-6">{t('reviews.alreadyReviewed')}</p>
          )}

          {user && !canReview && !alreadyReviewed && !loading && (
            <p className="text-white/40 text-sm mb-6">{t('reviews.needDelivered')}</p>
          )}

          {reviews.length === 0 ? (
            <p className="text-white/40">{t('reviews.empty')}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <article key={r.id} className="card-elegant p-5 border border-white/5">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <p className="font-medium text-white/90">{r.userName}</p>
                    <time className="text-white/35 text-xs">
                      {new Date(r.createdAt).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                  <StarRow rating={r.rating} />
                  <p className="text-white/65 text-sm mt-3 leading-relaxed">{r.comment}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
