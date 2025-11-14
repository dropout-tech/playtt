// 主題定義 - 統一的設計系統
export const theme = {
  colors: {
    primary: '#005CB9',
    secondary: '#FFD900',
    accent: '#38D430',
    text: '#1A1A1A',
    textLight: '#3C3D3D',
    textMuted: '#CFD2D3',
    background: '#FFFFFF',
    backgroundLight: '#F5F6F6',
  },
  fonts: {
    primary: "'Noto Sans TC', sans-serif",
    secondary: "'Futura', sans-serif",
  },
  breakpoints: {
    mobile: '414px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    wide: '1440px',
  },
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '48px',
    xxl: '80px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '26px',
    xxxl: '36px',
  },
  fontWeight: {
    normal: 500,
    bold: 700,
    black: 900,
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '50%',
  },
} as const;

// 媒體查詢輔助函數
export const media = {
  mobile: `@media screen and (max-width: ${theme.breakpoints.mobile})`,
  tablet: `@media screen and (max-width: ${theme.breakpoints.tablet})`,
  laptop: `@media screen and (max-width: ${theme.breakpoints.laptop})`,
  desktop: `@media screen and (max-width: ${theme.breakpoints.desktop})`,
  wide: `@media screen and (min-width: ${theme.breakpoints.wide})`,
};

