import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Check } from 'lucide-react';

const languages = [
  { code: 'az', label: 'AZ', title: 'Azərbaycan dili' },
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'ru', label: 'RU', title: 'Русский' },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current =
    languages.find(({ code }) => i18n.language?.startsWith(code)) ?? languages[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('touchstart', closeOnOutside);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('touchstart', closeOnOutside);
    };
  }, [open]);

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={current.title}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-all ${
          open
            ? 'border-accent/40 text-accent bg-accent/10'
            : 'border-white/10 text-white/70 hover:border-accent/25 hover:text-accent'
        }`}
      >
        <Menu size={14} className="shrink-0 opacity-80" />
        <span>{current.label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full right-0 pt-2 z-[110]"
            role="listbox"
            aria-label="Language"
          >
            <div className="nav-dropdown min-w-[140px] py-1">
              {languages.map(({ code, label, title }) => {
                const active = i18n.language?.startsWith(code);
                return (
                  <button
                    key={code}
                    type="button"
                    role="option"
                    aria-selected={active}
                    title={title}
                    onClick={() => selectLanguage(code)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'text-accent bg-accent/8'
                        : 'text-white/75 hover:text-accent hover:bg-white/5'
                    }`}
                  >
                    <span>{label}</span>
                    {active && <Check size={14} className="text-accent shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
