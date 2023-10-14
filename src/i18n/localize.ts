import de from "./languages/de.json";
import en from "./languages/en.json";

const defaultLang = "en";
const languages: Record<string, any> = { en, de };

export type ILocalizer = (key: string, lang?: string) => string;

export const initLocalize = (initLang: string = defaultLang): ILocalizer => {
  const localizer = (key: string, lang = initLang): string => {
    try {
      return (
        key.split(".").reduce((o, i) => o?.[i], languages[lang]) ||
        localizer(key, defaultLang)
      );
    } catch (e) {
      return localizer(key, defaultLang);
    }
  };
  return localizer;
};
