import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: string;
  accentColor: string;
  animations: boolean;
  reducedMotion: boolean;
  themes: Record<string, any>;
  accentColors: Record<string, string>;
  changeTheme: (theme: string) => void;
  toggleTheme: () => void;
  changeAccentColor: (color: string) => void;
  toggleAnimations: () => void;
  toggleReducedMotion: () => void;
  resetToDefaults: () => void;
  getCurrentTheme: () => any;
  getCurrentAccentColor: () => string;
  getThemeConfig: () => any;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('neon-blue');
  const [animations, setAnimations] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Available themes
  const themes: Record<string, any> = {
    dark: {
      name: 'Dark Neon',
      primary: '#0f0f23',
      secondary: '#1a1a2e',
      accent: '#00d4ff',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)'
    },
    space: {
      name: 'Space Blue',
      primary: '#0a0e27',
      secondary: '#1e2749',
      accent: '#4f46e5',
      text: '#ffffff',
      textSecondary: '#94a3b8',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1e2749 100%)'
    },
    classic: {
      name: 'Classic Dark',
      primary: '#1f2937',
      secondary: '#374151',
      accent: '#3b82f6',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)'
    },
    light: {
      name: 'Light Mode',
      primary: '#ffffff',
      secondary: '#f8fafc',
      accent: '#3b82f6',
      text: '#1f2937',
      textSecondary: '#6b7280',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
    }
  };

  // Available accent colors
  const accentColors: Record<string, string> = {
    'neon-blue': '#00d4ff',
    'neon-purple': '#a855f7',
    'neon-green': '#10b981',
    'neon-pink': '#ec4899',
    'neon-orange': '#f59e0b',
    'neon-red': '#ef4444'
  };

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedAccentColor = localStorage.getItem('accentColor');
    const savedAnimations = localStorage.getItem('animations');
    const savedReducedMotion = localStorage.getItem('reducedMotion');

    setTheme('dark');

    if (savedAccentColor && accentColors[savedAccentColor]) {
      setAccentColor(savedAccentColor);
    }

    if (savedAnimations !== null) {
      setAnimations(JSON.parse(savedAnimations));
    }

    if (savedReducedMotion !== null) {
      setReducedMotion(JSON.parse(savedReducedMotion));
    }

    // Check for system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const currentTheme = themes[theme];
    const currentAccentColor = accentColors[accentColor];

    // Set CSS custom properties
    document.documentElement.style.setProperty('--color-primary', currentTheme.primary);
    document.documentElement.style.setProperty('--color-secondary', currentTheme.secondary);
    document.documentElement.style.setProperty('--color-accent', currentAccentColor);
    document.documentElement.style.setProperty('--color-text', currentTheme.text);
    document.documentElement.style.setProperty('--color-text-secondary', currentTheme.textSecondary);
    document.documentElement.style.setProperty('--background-gradient', currentTheme.background);

    // Set theme class on body
    document.body.className = `theme-${theme} accent-${accentColor}`;

    // Set reduced motion preference
    if (reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.style.setProperty('--transition-duration', '0s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
      document.documentElement.style.setProperty('--transition-duration', '0.2s');
    }
  }, [theme, accentColor, reducedMotion]);

  const changeTheme = (newTheme: string) => {
    if (themes[newTheme]) {
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(nextTheme);
  };

  const changeAccentColor = (newAccentColor: string) => {
    if (accentColors[newAccentColor]) {
      setAccentColor(newAccentColor);
      localStorage.setItem('accentColor', newAccentColor);
    }
  };

  const toggleAnimations = () => {
    const newAnimations = !animations;
    setAnimations(newAnimations);
    localStorage.setItem('animations', JSON.stringify(newAnimations));
  };

  const toggleReducedMotion = () => {
    const newReducedMotion = !reducedMotion;
    setReducedMotion(newReducedMotion);
    localStorage.setItem('reducedMotion', JSON.stringify(newReducedMotion));
  };

  const resetToDefaults = () => {
    setTheme('dark');
    setAccentColor('neon-blue');
    setAnimations(true);
    setReducedMotion(false);
    
    localStorage.removeItem('theme');
    localStorage.removeItem('accentColor');
    localStorage.removeItem('animations');
    localStorage.removeItem('reducedMotion');
  };

  const getCurrentTheme = () => themes[theme];
  const getCurrentAccentColor = () => accentColors[accentColor];

  const getThemeConfig = () => ({
    isDark: theme !== 'light',
    isLight: theme === 'light',
    name: themes[theme].name,
    colors: {
      primary: themes[theme].primary,
      secondary: themes[theme].secondary,
      accent: accentColors[accentColor],
      text: themes[theme].text,
      textSecondary: themes[theme].textSecondary
    }
  });

  const value = {
    // Current state
    theme,
    accentColor,
    animations,
    reducedMotion,
    
    // Available options
    themes,
    accentColors,
    
    // Actions
    changeTheme,
    toggleTheme,
    changeAccentColor,
    toggleAnimations,
    toggleReducedMotion,
    resetToDefaults,
    
    // Getters
    getCurrentTheme,
    getCurrentAccentColor,
    getThemeConfig
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;