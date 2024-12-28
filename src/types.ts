type IHassEntityState = {
  attributes: {
    forecast: IForecast[];
  };
};

export type IHass = {
  states: Record<string, IHassEntityState>;
  connection: {
    subscribeMessage: (
      cb: (event: IForecastEventData) => void,
      options: { type: string; forecast_type: ForecastType; entity_id: string },
    ) => Promise<() => void>;
  };
  services?: {
    weather?: {
      get_forecast: () => void | undefined;
      get_forecasts: () => void | undefined;
    };
  };
  locale?: {
    language: string;
  };
};

export type IConfig = {
  entity: string;
  locale?: string;
};

export enum ForecastType {
  hourly = "hourly",
  daily = "daily",
}

export type IForecast = {
  datetime: string;
  condition: string;
  temperature: number;
  templow: number;
  precipitation: number;
  precipitation_probability: number;
};

export type IForecastDay = {
  date: string;
  forecast: IForecast[];
};

export type IForecastEventData = {
  forecast: IForecast[];
  type: ForecastType;
};
