# Weather Table Card for Home Assistant

## Overview

This is a custom card for Home Assistant that displays the current weather forecast as a table. It provides information on temperature and the chance of rain with rainfall measured in millimeters.

## Installation

To get started with this custom HACS plugin, follow these steps:

1. Begin by adding a custom repository. You can refer to [this guide](https://hacs.xyz/docs/faq/custom_repositories/) for detailed instructions.

2. Install the card using HACS. You can install it in the same way you would for other plugins.

3. Once the card is installed, feel free to add as many instances of it to your dashboard as you desire.

## Configuration

Add the following to your Lovelace configuration:

```yaml
type: 'custom:weather-table-card'
entity: weather.your_weather_entity
```

Replace `weather.your_weather_entity` with the actual entity ID of your weather component.

## Development

This custom card is written in TypeScript and uses Parcel for building the final JavaScript file.

### Building

To build the final JavaScript file, run the following command:

```bash
yarn build
```

### Development Server

During development, you can use the development server provided by Parcel. Run the following command to start the server:

```bash
yarn dev
```

The development file will be available at [http://localhost:1234/weather-table-card.js](http://localhost:1234/weather-table-card.js).
You can add it to you Dashboard via Settings > Dashboards > Resources (in the top right corner)

## Known Issues
- missing editor

## Contributions

Contributions are welcome! If you'd like to contribute to this project, feel free to fork the repository and submit a pull request.

## License

This custom card is licensed under the [MIT License](LICENSE).
