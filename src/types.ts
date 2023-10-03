export type IForecast = {
  datetime: string;
  condition: string;
  temperature: number;
  templow: number;
  precipitation: number;
  precipitation_probability: number;
};

export type IForecastByDay = {
  date: string;
  forecast: IForecast[];
}[];
