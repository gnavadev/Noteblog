import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

const PRIMARY_BLUE = '#007aff'; // macOS Blue

export const getThemeConfig = (mode: 'light' | 'dark'): ThemeConfig => ({
  algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: PRIMARY_BLUE,
    borderRadius: 12,
    fontFamily: "'Nunito', sans-serif",
    ...(mode === 'dark' && {
      colorBgBase: '#282a36',
      colorBgContainer: '#1e1f29',
      colorTextBase: '#f8f8f2',
      colorBorder: 'rgba(255, 255, 255, 0.1)',
      colorBgElevated: '#44475a',
    })
  },
  components: {
    Button: {
      borderRadius: 10,
      fontWeight: 600,
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Layout: {
      headerBg: mode === 'dark' ? '#1e1f29' : '#ffffff',
      bodyBg: mode === 'dark' ? '#282a36' : '#F8F9FA',
      triggerBg: mode === 'dark' ? '#1e1f29' : '#ffffff',
    }
  },
});
