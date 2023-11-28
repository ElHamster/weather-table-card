import de from "./languages/de.json";
import en from "./languages/en.json";

const defaultLang = "en";
const languages: Record<string, any> = { en, de };

export type ILocalizer = (key: string, lang?: string) => string;

export const initLocalize = (initLang: string = defaultLang): ILocalizer => {
  const localizer = (key: string, lang = initLang): string => {
    try {
      const translation = key
        .split(".")
        .reduce((o, i) => o?.[i], languages[lang]);

      // when found, return the correct translation
      if (translation) return translation;

      // when not found and the language is the default language, return the key so we know what to translate
      if (lang === defaultLang) return key;

      // when not found and the language is not the default language, try to check the default lang
      return localizer(key, defaultLang);
    } catch (e) {
      return localizer(key, defaultLang);
    }
  };
  return localizer;
};
