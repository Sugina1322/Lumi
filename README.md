# Lumi

Lumi is a travel companion app built with Expo Router, Supabase, and React Native. It helps users plan commutes, track trip budgets, manage expenses, and save places locally on device.

## Features

- Google sign-in through Supabase
- Live commute routing with Google Routes API
- Travel budget tracking
- Expense logging and persistence
- Saved places and trip planning
- Custom app themes
- Local settings and preferences

## Tech Stack

- Expo SDK 54
- Expo Router
- Supabase Auth
- Secure local persistence with SecureStore
- Google Routes API for commute data

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm run start
   ```
3. For a development build:
   ```bash
   npx expo start --dev-client
   ```

## Environment

Create a `.env` file in the project root with your local secrets and API keys. The app expects Supabase and Google Maps credentials to be available through Expo environment variables.

## Notes

- Commute results use live routing when the Google Routes API is configured.
- Theme preferences and travel data are stored locally on the device.
- Some features also sync learned preferences to Supabase when the user is signed in.
