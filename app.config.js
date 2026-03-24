const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo ?? {};
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return {
    ...expo,
    android: {
      ...expo.android,
      config: {
        ...(expo.android?.config ?? {}),
        googleMaps: {
          ...(expo.android?.config?.googleMaps ?? {}),
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
