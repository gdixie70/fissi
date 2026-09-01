import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/** Palette per i pallini/badge colore dei singoli pagamenti (indipendente dal tema chiaro/scuro). */
export const ACCENT_COLORS = [
  '#3E63DD',
  '#E5484D',
  '#30A46C',
  '#F76B15',
  '#8E4EC6',
  '#0091FF',
  '#71717A',
  '#EAB308', // giallo
  '#FFFFFF', // bianco
];

/** Verde "successo" unico, usato per lo stato pagato/riuscito ovunque nell'app. */
export const SUCCESS_COLOR = '#30A46C';

/** Gradiente della card "hero" del ciclo in Dashboard (indaco -> viola), uguale in chiaro/scuro:
 * è un elemento a colore pieno, non una superficie neutra, quindi non serve una variante per tema. */
export const HERO_GRADIENT = ['#3E63DD', '#8E4EC6'] as const;

/** Oro/giallo della "freccia circolare" del logo SottOcchio — l'accento riservato ai momenti
 * Premium, distinto dal viola secondario usato per il resto dell'interfaccia. */
export const SPARK_COLOR = '#EAB308';

/** Nero o bianco a seconda della luminanza del colore di sfondo, per garantire
 * un'icona sempre leggibile sopra i badge colorati (es. il bianco della palette). */
export function getContrastColor(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1C1B1F' : '#FFFFFF';
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3E63DD',
    secondary: '#8E4EC6',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#F0E4FA',
    onSecondaryContainer: '#3B1D5C',
    tertiary: '#EAB308',
    onTertiary: '#3A2E00',
    tertiaryContainer: '#FEF3C6',
    onTertiaryContainer: '#5C4400',
    background: '#F5F6FB',
    surface: '#FFFFFF',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8DA4FF',
    secondary: '#C9A6F0',
    onSecondary: '#3B1D5C',
    secondaryContainer: '#4A2E70',
    onSecondaryContainer: '#F0E4FA',
    tertiary: '#FDE047',
    onTertiary: '#3A2E00',
    tertiaryContainer: '#54430A',
    onTertiaryContainer: '#FEF3C6',
    background: '#10141F',
    surface: '#161B29',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1C2436',
    },
  },
};
