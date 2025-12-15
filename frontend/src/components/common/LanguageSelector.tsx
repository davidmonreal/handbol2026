import { useLanguage } from '../../context/LanguageContext';
import { availableLanguages } from '../../i18n/translations';
import type { LanguageCode } from '../../i18n/translations';
import { SearchableSelectWithCreate } from './SearchableSelectWithCreate';

interface LanguageSelectorProps {
  className?: string;
  label?: string;
}

export const LanguageSelector = ({ className = 'w-64', label }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();

  return (
    <SearchableSelectWithCreate
      label={label}
      className={className}
      value={language}
      options={availableLanguages.map(option => ({
        value: option.code,
        label: option.label,
      }))}
      onChange={(value) => setLanguage(value as LanguageCode)}
      placeholder="Select language"
      showSearchInput={false}
      allowCustomOption={false}
    />
  );
};
