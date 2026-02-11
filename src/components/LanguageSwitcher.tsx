import React from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all w-full text-sm"
      title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Globe size={16} />
      <span className="font-medium uppercase tracking-wider text-xs">
        {language === 'en' ? '🇺🇸 EN' : '🇦🇷 ES'}
      </span>
    </button>
  );
};
