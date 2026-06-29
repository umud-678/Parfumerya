import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCategories } from '../../services/catalog';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import type { Category } from '../../types';

export default function Footer() {
  const { t } = useTranslation();
  const { settings, siteName } = useSiteSettings();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const footerDesc = settings?.footerDescription || settings?.siteTagline || '';

  return (
    <footer className="border-t border-white/5 mt-8">
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-serif text-xl mb-4 text-accent">{siteName}</h3>
          {footerDesc ? (
            <p className="text-white/50 text-sm leading-relaxed">
              {footerDesc}
            </p>
          ) : null}
          {settings?.socialLinks?.length ? (
            <div className="flex flex-wrap gap-3 mt-4">
              {settings.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent/70 hover:text-accent border border-accent/20 px-3 py-1 rounded-full"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h4 className="text-accent/80 text-sm font-medium mb-4">{t('footer.categories')}</h4>
          <ul className="space-y-2 text-sm text-white/50">
            {categories.length === 0 ? (
              <li className="text-white/30">{t('shop.noProducts')}</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="hover:text-accent transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-accent/80 text-sm font-medium mb-4">{t('footer.support')}</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/contact" className="hover:text-accent transition-colors">{t('nav.contact')}</Link></li>
            <li><Link to="/about" className="hover:text-accent transition-colors">{t('nav.about')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-accent/80 text-sm font-medium mb-4">{t('footer.contact')}</h4>
          {settings?.email && <p className="text-sm text-white/50">{settings.email}</p>}
          {settings?.phone && <p className="text-sm text-white/50">{settings.phone}</p>}
          {settings?.address && <p className="text-sm text-white/50 mt-1">{settings.address}</p>}
        </div>
      </div>
      <div className="text-center text-white/30 text-xs py-6 border-t border-white/5">
        © {new Date().getFullYear()} {siteName}. {t('footer.rights')}
      </div>
    </footer>
  );
}
