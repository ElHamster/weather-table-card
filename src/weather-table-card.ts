import { css, html, LitElement, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators.js";

import { clsx, getCondition } from "./utils.ts";
import { ILocalizer, initLocalize } from "./i18n/localize.ts";
import {
  ForecastType,
  IConfig,
  IForecast,
  IForecastDay,
  IForecastEventData,
  IHass,
} from "./types.ts";
import { ICONS } from "./constants.ts";

import classes from "bundle-text:./styles.css";

const IS_DEV = process.env.NODE_ENV === "development";
const CARD_NAME = `weather-forecast-card${IS_DEV ? "-dev" : ""}`;

@customElement(CARD_NAME)
class WeatherForecastCard extends LitElement {
  @property()
  config: IConfig = { entity: "" };

  @property()
  forecastEventData: IForecastEventData | undefined;

  @property()
  activeDay: string = new Date().toDateString();

  private hass: IHass | undefined;
  private subscribedToForecast: Promise<() => void> | undefined = undefined;
  private localize: ILocalizer = initLocalize();

  static styles = css`
    ${unsafeCSS(classes)}
  `;

  constructor() {
    super();
  }

  // Lit - Lifecycle methods START

  // connects the component to the forecast events when mounted
  connectedCallback() {
    this.localize = initLocalize(
      this.config.locale || this.hass?.locale?.language,
    );
    super.connectedCallback();
  }

  // disconnects the component from the forecast events on unmount
  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeForecastEvents();
  }

  updated(oldProps: Map<string, any>) {
    super.updated(oldProps);

    const oldConfig: IConfig = oldProps.get("config");

    if (
      !this.subscribedToForecast ||
      (oldConfig && this.config?.entity !== oldConfig.entity)
    ) {
      this.subscribeToForecastEvents();
    }

    if (oldConfig && this.config.locale !== oldConfig.locale) {
      console.log("locale", this.config.locale);
      this.localize = initLocalize(
        this.config.locale || this.hass?.locale?.language,
      );
      this.requestUpdate();
    }
  }

  // Lit - Lifecycle methods END

  // subscribes to forecast events
  subscribeToForecastEvents() {
    this.unsubscribeForecastEvents();

    if (
      !this.isConnected ||
      !this.hass ||
      !this.config ||
      !this.config.entity ||
      !this.hassSupportsForecastEvents()
    ) {
      return;
    }

    this.subscribedToForecast = this.hass?.connection.subscribeMessage(
      (evt: IForecastEventData) => {
        this.forecastEventData = evt;
      },
      {
        type: "weather/subscribe_forecast",
        forecast_type: ForecastType.hourly,
        entity_id: this.config.entity,
      },
    );
  }

  // unsubscribes from forecast events
  unsubscribeForecastEvents() {
    if (this.subscribedToForecast) {
      this.subscribedToForecast.then((unsub) => unsub());
      this.subscribedToForecast = undefined;
    }
  }

  // splits the hourly forecast in days
  splitForecastInDays() {
    const forecastByDay: IForecastDay[] = [];
    const forecastRaw = this.getRawForecast();
    forecastRaw.forEach((it) => {
      const dayString = new Date(it.datetime).toDateString();
      let dayIndex = forecastByDay.findIndex((it) => it.date === dayString);
      if (dayIndex === -1) {
        dayIndex = forecastByDay.length;
        forecastByDay.push({
          date: dayString,
          forecast: [],
        });
      }

      forecastByDay[dayIndex].forecast.push(it);
    });

    return forecastByDay;
  }

  // gets the raw forecast from the entity or forecast event
  getRawForecast(): IForecast[] {
    return (
      this.forecastEventData?.forecast ??
      this.hass?.states[this.config.entity]?.attributes.forecast ??
      []
    );
  }

  // checks that the running hass version actually supports the forecast event api
  hassSupportsForecastEvents(): boolean {
    return !!this.hass?.services?.weather?.get_forecast;
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
    const forecastByDay = this.splitForecastInDays();

    if (!forecastByDay?.length) return html`<div></div>`;

    const activeForecastDay =
      forecastByDay.find((it) => it.date === this.activeDay) ??
      forecastByDay[0];

    return html`<ha-card>
      <div class="headContainer">
        ${forecastByDay.slice(0, 7).map((forecastDay) => {
          const date = new Date(forecastDay.date);
          const isActive = this.activeDay === forecastDay.date;

          return html`<div
            class="${clsx("headItem", isActive && "headItemActive")}"
            @click="${() => {
              this.activeDay = forecastDay.date;
            }}"
          >
            ${this.localize("dayNames")?.[date.getDay()]}
          </div>`;
        })}
      </div>
      <div class="forecastContainer">
        <div class="forecastHeadline">
          ${this.localize("headline.temperature")}
        </div>
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
              ${this.localize(`conditions.${condition}`)}
            </div>
          </div>`;
        })}
      </div>
      <div class="forecastContainer">
        <div class="forecastHeadline">
          ${this.localize("headline.precipitation")}
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
  type: CARD_NAME,
  name: `Weather Forecast Table Card${IS_DEV ? "- DEVELOPMENT" : ""}`,
  preview: false, // Optional - defaults to false
  description: "A custom card made by me!", // Optional
});
window.parcelRequire = undefined;
