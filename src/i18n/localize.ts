import de from "./languages/de.json";
import en from "./languages/en.json";

const languages: Record<string, any> = { en, de };

export const localize = (key: string, lang = "de") => {
  try {
    return key.split(".").reduce((o, i) => o[i], languages[lang]) || key;
  } catch (e) {
    return key;
  }
};
