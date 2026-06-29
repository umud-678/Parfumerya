import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'az', label: 'AZ', title: 'Azərbaycan dili' },
  { code: 'en', label: 'EN', title: 'English' },
  { code: 'ru', label: 'RU', title: 'Русский' },
] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-0.5 rounded-full p-0.5 border border-white/10">
      {languages.map(({ code, label, title }) => (
        <button
          key={code}
          type="button"
          title={title}
          onClick={() => i18n.changeLanguage(code)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
            i18n.language?.startsWith(code)
              ? 'bg-accent text-plum-950'
              : 'text-white/45 hover:text-accent'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
