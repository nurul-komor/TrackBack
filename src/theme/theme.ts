import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007AFF',
    secondary: '#34C759',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    error: '#FF3B30',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1C1C1E',
    onSurface: '#1C1C1E',
  },
};

export const COLORS = {
  primary: '#007AFF',
  accent: '#34C759',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  error: '#FF3B30',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  separator: '#C6C6C8',
  lostChip: '#FF3B30',
  foundChip: '#34C759',
  inputBackground: '#E5E5EA',
};
