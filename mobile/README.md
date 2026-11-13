# Plant Papa Mobile

Expo React Native app (spec: "Plant Papa Mobile — Core"). The web app in `src/`
is untouched; this directory is additive.

## Structure

- `app/` — expo-router routes: `(auth)/`, `(app)/` tabs (Garden/Feed/Profile), `(dev)/stories` component gallery
- `src/theme/` — design tokens (colors, spacing, radius, typography); components never hardcode colors or spacing
- `src/components/` — Atomic Design: `atoms/`, `molecules/`, `organisms/`, `templates/`
- `src/lib/` — pure helpers (relative time)

## Commands

```bash
npm install
npx expo start        # iOS simulator / Android emulator / Expo Go
npx tsc --noEmit      # typecheck (CI)
```

Preview components in Expo Go at `/stories` (also linked from the Profile tab).
