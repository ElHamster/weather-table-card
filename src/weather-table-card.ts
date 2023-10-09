import { css, html, LitElement, unsafeCSS } from "lit";

// @ts-ignore
import { customElement, property } from "lit/decorators";
import { clsx, getCondition } from "./utils.ts";
import { localize } from "./i18n/localize.ts";
import {
  IConfig,
  IForecast,
  IForecastByDay,
  IForecastEventData,
} from "./types.ts";

import classes from "bundle-text:./styles.css";

const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const ICONS: Record<string, string> = {
  "clear-night": "night",
  "partlycloudy-night": "night-partly-cloudy",
  cloudy: "cloudy",
  fog: "fog",
  hail: "hail",
  lightning: "lightning",
  "lightning-rainy": "lightning-rainy",
  partlycloudy: "partly-cloudy",
  pouring: "pouring",
  rainy: "rainy",
  snowy: "snowy",
  "snowy-rainy": "snowy-rainy",
  sunny: "sunny",
  windy: "windy",
  "windy-variant": "windy-variant",
  exceptional: "alert-outline",
};

@customElement("weather-forecast-card")
class WeatherForecastCard extends LitElement {
  @property()
  config: IConfig = { entity: "" };

  @property()
  forecastEventData: IForecastEventData | undefined;

  @property()
  activeDay: string = new Date().toDateString();

  @property()
  forecastByDay: IForecastByDay = [];

  private hass: Record<string, any> = {};
  private subscribedToForecast: any = undefined;

  static styles = css`
    ${unsafeCSS(classes)}
  `;

  // Lit - Lifecycle methods START
  // connects the component to the forecast events when mounted

  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) {
      this.subscribeToForecastEvents();
    }
  }

  // discconects the component from the forecast events on unmount
  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeForecastEvents();
  }

  updated(changedProps: Map<string, any>) {
    super.updated(changedProps);

    this.splitForecastInDays();
    this.activeDay = this.activeDay ?? this.forecastByDay?.[0]?.date;
    const changedConfig: IConfig = changedProps.get("config");

    if (
      !this.subscribedToForecast ||
      this.config?.entity !== changedConfig?.entity
    ) {
      this.subscribeToForecastEvents();
    }

    console.log(this.config.entity);
    console.log(this.forecastByDay);
  }

  // Lit - Lifecycle methods END

  // subscribes to forecast events
  async subscribeToForecastEvents() {
    this.unsubscribeForecastEvents();
    this.subscribedToForecast = this.hass.connection.subscribeMessage(
      (evt: IForecastEventData) => {
        this.forecastEventData = evt;
      },
      {
        type: "weather/subscribe_forecast",
        forecast_type: "hourly",
        entity_id: this.config.entity,
      },
    );
  }

  // unsubscribes from forecast events
  unsubscribeForecastEvents() {
    if (this.subscribedToForecast) {
      this.subscribedToForecast.then((unsub: () => void) => unsub());
      this.subscribedToForecast = undefined;
    }
  }

  // splits the hourly forecast in days
  splitForecastInDays() {
    this.forecastByDay = [];
    const forecastRaw = this.getRawForecast();
    forecastRaw.forEach((it) => {
      const dayString = new Date(it.datetime).toDateString();
      let dayIndex = this.forecastByDay.findIndex(
        (it) => it.date === dayString,
      );
      if (dayIndex === -1) {
        dayIndex = this.forecastByDay.length;
        this.forecastByDay.push({
          date: dayString,
          forecast: [],
        });
      }

      this.forecastByDay[dayIndex].forecast.push(it);
    });

    return this.forecastByDay;
  }

  getRawForecast(): IForecast[] {
    return (
      this.forecastEventData?.forecast ??
      this.hass?.states[this.config.entity]?.attributes.forecast ??
      []
    );
  }

  // sets the config provided by the user
  // needed by Home Assistant
  setConfig(config: IConfig) {
    this.config = config;
  }

  // sets a default config for the component
  // needed by Home Assistant
  static getStubConfig(): IConfig {
    return { entity: "weather.forecast_home" };
  }

  render() {
    if (!this.forecastByDay?.length) return html`<div>loading...</div>`;

    const activeForecastDay =
      this.forecastByDay.find((it) => it.date === this.activeDay) ??
      this.forecastByDay[0];

    return html`<ha-card>
      <div class="headContainer">
        ${this.forecastByDay.slice(0, 7).map((forecastDay) => {
          const date = new Date(forecastDay.date);
          const isActive = this.activeDay === forecastDay.date;

          return html`<div
            class="${clsx("headItem", isActive && "headItemActive")}"
            @click="${() => {
              this.activeDay = forecastDay.date;
            }}"
          >
            ${dayNames[date.getDay()]}.
          </div>`;
        })}
      </div>
      <div class="forecastContainer">
        <div class="forecastHeadline">${localize("headline.temperature")}</div>
        ${activeForecastDay.forecast.map((it) => {
          const date = new Date(it.datetime);
          const condition = getCondition(it);
          const icon = "mdi:weather-" + ICONS[condition];

          return html`<div class="forecastItem">
            <div>${date.getHours()}:00</div>
            <div><ha-icon icon=${icon}></ha-icon></div>
            <div style="text-align:center;">
              <span
                style="color: var(${it.temperature > 30
                  ? "--red-color"
                  : "--orange-color"})"
                >${it.temperature}°</span
              >/<span style="color:var(--blue-color)">${it.templow}°</span>
            </div>
            <div style="text-align:right;">
              ${localize(`conditions.${condition}`)}
            </div>
          </div>`;
        })}
      </div>
      <div class="forecastContainer">
        <div class="forecastHeadline">
          ${localize("headline.precipitation")}
        </div>
        ${activeForecastDay.forecast.map((it) => {
          const date = new Date(it.datetime);

          return html`<div class="forecastItem">
            <div>${date.getHours()}:00</div>
            <div></div>
            <div style="text-align:center;">
              <span style="color:var(--blue-color)"
                >${it.precipitation} mm</span
              >
            </div>
            <div style="text-align:right;">
              ${it.precipitation_probability}%
            </div>
          </div>`;
        })}
      </div>
    </ha-card>`;
  }
}

declare global {
  interface Window {
    customCards?: {
      type: string;
      name: string;
      preview: boolean;
      description: string;
    }[];
    parcelRequire?: any;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-forecast-card",
  name: "Custom: Weather Forecast",
  preview: false, // Optional - defaults to false
  description: "A custom card made by me!", // Optional
});
window.parcelRequire = undefined;
