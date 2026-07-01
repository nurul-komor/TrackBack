import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2D2A68',
    secondary: '#FC9E7E',
    background: '#F7F8F9',
    surface: '#FFFFFF',
    error: '#E53935',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A2E',
    onSurface: '#1A1A2E',
  },
};

export const COLORS = {
  primary: '#2D2A68',
  accent: '#FC9E7E',
  background: '#F7F8F9',
  surface: '#FFFFFF',
  error: '#E53935',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  lostChip: '#2D2A68',
  foundChip: '#FC9E7E',
};
