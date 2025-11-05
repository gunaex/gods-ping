/**
 * Gods Ping - Warm & Safe Theme
 * Designed to feel inviting, trustworthy, and calming
 * Accessible for all users including color blind individuals
 */

export const colors = {
  // Warm Primary colors - Earthy and inviting
  primary: {
    warmRed: '#D97757',      // Soft terracotta
    coral: '#E8876E',        // Warm coral
    peach: '#F4A582',        // Gentle peach
    sage: '#8FA888',         // Natural sage green
    clay: '#B88A6F',         // Warm clay brown
    sand: '#E5C9A6',         // Soft sand
  },

  // Background colors - Warm and cozy
  background: {
    primary: '#FFF8F0',      // Warm cream (light mode)
    secondary: '#F5EDE3',    // Soft beige
    tertiary: '#EBE0D5',     // Light tan
    dark: '#2D2520',         // Warm dark brown (dark mode)
    darker: '#1F1814',       // Deep warm black
    card: 'rgba(255, 248, 240, 0.8)',  // Translucent warm white
    cardHover: 'rgba(255, 248, 240, 0.95)',
    overlay: 'rgba(45, 37, 32, 0.85)',  // Warm overlay
  },

  // Text colors - Warm and readable
  text: {
    primary: '#2D2520',      // Warm dark brown
    secondary: '#6B5D54',    // Medium brown
    tertiary: '#9B8A7E',     // Light brown
    inverse: '#FFF8F0',      // Warm white for dark backgrounds
    muted: '#ADA098',        // Very light brown
  },

  // Status colors - Warm versions with patterns
  status: {
    success: {
      color: '#7BAA6D',      // Warm green
      bg: 'rgba(123, 170, 109, 0.12)',
      border: '#7BAA6D',
      pattern: '✓',
    },
    error: {
      color: '#D97757',      // Warm red (terracotta)
      bg: 'rgba(217, 119, 87, 0.12)',
      border: '#D97757',
      pattern: '✗',
    },
    warning: {
      color: '#E8B563',      // Warm amber/gold
      bg: 'rgba(232, 181, 99, 0.12)',
      border: '#E8B563',
      pattern: '⚠',
    },
    info: {
      color: '#6B9EB5',      // Soft teal-blue
      bg: 'rgba(107, 158, 181, 0.12)',
      border: '#6B9EB5',
      pattern: 'ℹ',
    },
  },

  // Trading colors - Earthy and distinguishable
  trading: {
    buy: {
      color: '#7BAA6D',      // Warm green
      bg: 'rgba(123, 170, 109, 0.15)',
      border: '#7BAA6D',
      shape: '▲',
    },
    sell: {
      color: '#D97757',      // Warm terracotta
      bg: 'rgba(217, 119, 87, 0.15)',
      border: '#D97757',
      shape: '▼',
    },
    neutral: {
      color: '#9B8A7E',      // Warm neutral
      bg: 'rgba(155, 138, 126, 0.15)',
      border: '#9B8A7E',
      shape: '●',
    },
  },

  // Chart colors - Warm and distinct
  chart: {
    line1: '#6B9EB5',        // Soft teal
    line2: '#E8876E',        // Warm coral
    line3: '#8FA888',        // Sage green
    line4: '#E8B563',        // Warm gold
    grid: 'rgba(107, 93, 84, 0.1)',
    axis: 'rgba(107, 93, 84, 0.25)',
  },

  // Log categories - Warm colors with icons
  logs: {
    error: { color: '#D97757', icon: '🔴', bg: 'rgba(217, 119, 87, 0.1)' },
    user: { color: '#6B9EB5', icon: '👤', bg: 'rgba(107, 158, 181, 0.1)' },
    ai_thinking: { color: '#9B8A7E', icon: '🤔', bg: 'rgba(155, 138, 126, 0.1)' },
    ai_action: { color: '#7BAA6D', icon: '⚡', bg: 'rgba(123, 170, 109, 0.1)' },
    trading: { color: '#E8876E', icon: '💹', bg: 'rgba(232, 135, 110, 0.1)' },
    config: { color: '#E8B563', icon: '⚙️', bg: 'rgba(232, 181, 99, 0.1)' },
    bot: { color: '#B88A6F', icon: '🤖', bg: 'rgba(184, 138, 111, 0.1)' },
    market: { color: '#8FA888', icon: '📈', bg: 'rgba(143, 168, 136, 0.1)' },
    system: { color: '#6B5D54', icon: '🖥️', bg: 'rgba(107, 93, 84, 0.1)' },
  },

  // Borders - Soft and warm
  border: {
    default: 'rgba(107, 93, 84, 0.15)',
    hover: 'rgba(107, 93, 84, 0.3)',
    focus: '#6B9EB5',        // Soft blue for focus
    subtle: 'rgba(107, 93, 84, 0.08)',
  },

  // Shadows - Soft and natural
  shadow: {
    sm: '0 2px 8px rgba(45, 37, 32, 0.08)',
    md: '0 4px 16px rgba(45, 37, 32, 0.12)',
    lg: '0 8px 32px rgba(45, 37, 32, 0.16)',
    warm: '0 4px 12px rgba(184, 138, 111, 0.15)',
  },

  // Accent colors - Warm highlights
  accent: {
    warm: '#F4A582',         // Gentle peach
    cozy: '#E5C9A6',         // Soft sand
    earth: '#B88A6F',        // Clay
    natural: '#8FA888',      // Sage
  },
};

// Helper function to get contrasting text color
export const getContrastText = (bgColor: string): string => {
  // Determine contrast based on background luminance (simple hex parser)
  const hex = bgColor.startsWith('#') ? bgColor.slice(1) : bgColor;
  // Fallback for rgba/transparent: default to primary text
  if (hex.length !== 3 && hex.length !== 6) {
    return colors.text.primary;
  }
  const fullHex = hex.length === 3
    ? hex.split('').map(c => c + c).join('')
    : hex;
  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;
  // Relative luminance (WCAG)
  const srgb = [r, g, b].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  // If background is light, return dark text; else return inverse (light) text
  return luminance > 0.5 ? colors.text.primary : colors.text.inverse;
};

// Typography - Warm and friendly
export const typography = {
  fontFamily: "'Nunito', 'Lato', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  baseSize: '16px',
  lineHeight: 1.6,
  headingWeight: 700,
  bodyWeight: 400,
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    round: '50%',
  },
};

// Accessibility patterns for different states
export const patterns = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  buy: '▲',
  sell: '▼',
  neutral: '●',
  active: '●',
  inactive: '○',
  loading: '⟳',
};

export default colors;
