export interface Palette {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  skeleton: string;
  dark: boolean;
}

// Brand green carried over from the web app (src/components/elements/button/button.css).
export const brandGreen = '#00aa00';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

// Minimum interactive size (44pt) per the spec's accessibility floor.
export const minTouchTarget = 44;

export const colors: { light: Palette; dark: Palette } = {
  light: {
    background: '#f7f9f4',
    surface: '#ffffff',
    surfaceMuted: '#eef2e8',
    text: '#1c2417',
    textMuted: '#5c6b53',
    primary: brandGreen,
    onPrimary: '#ffffff',
    border: '#dde5d4',
    success: brandGreen,
    warning: '#b96a00',
    danger: '#c22f2f',
    skeleton: '#e4ebdc',
    dark: false,
  },
  dark: {
    background: '#12160f',
    surface: '#1d241a',
    surfaceMuted: '#28301f',
    text: '#f0f4ea',
    textMuted: '#a8b69c',
    primary: '#33bb33',
    onPrimary: '#0c1a08',
    border: '#33402c',
    success: '#33bb33',
    warning: '#e0a04a',
    danger: '#ef6b6b',
    skeleton: '#28301f',
    dark: true,
  },
};

export type ThemeColors = Palette;

export const typography = {
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
} as const;

export type TypographyToken = keyof typeof typography;
