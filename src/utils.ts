import { IForecast } from "./types.js";

export const clsx = (...classes: unknown[]): string => {
  return classes
    .filter((it) => typeof it === "string")
    .join(" ")
    .trim();
};

export const getCondition = (forecast: IForecast) => {
  const date = new Date(forecast.datetime);
  const hour = date.getHours();

  if (hour <= 6 || hour >= 21) {
    if (forecast.condition === "sunny") return "clear-night";

    if (forecast.condition === "partlycloudy") return "partlycloudy-night";
  }

  return forecast.condition;
};
