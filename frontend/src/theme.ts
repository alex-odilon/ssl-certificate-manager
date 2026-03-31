import { createTheme, alpha } from '@mui/material/styles';

// ─── Dark Palette ─────────────────────────────────────────────────────────────
const darkPalette = {
  mode: 'dark' as const,
  primary:    { main: '#00e5ff', light: '#5cffff', dark: '#00b2cc', contrastText: '#000000' },
  secondary:  { main: '#f50057', light: '#ff5983', dark: '#bb002f', contrastText: '#ffffff' },
  background: { default: '#0a0b1e', paper: '#131429' },
  text:       { primary: '#ffffff', secondary: 'rgba(255,255,255,0.7)' },
  success:    { main: '#00e676' },
  error:      { main: '#ff1744' },
  warning:    { main: '#ffc400' },
};

// ─── Light Palette ────────────────────────────────────────────────────────────
const lightPalette = {
  mode: 'light' as const,
  primary:    { main: '#0066cc', light: '#3d8fe0', dark: '#004499', contrastText: '#ffffff' },
  secondary:  { main: '#c2185b', light: '#e91e8c', dark: '#880e4f', contrastText: '#ffffff' },
  background: { default: '#f0f4f8', paper: '#ffffff' },
  text:       { primary: '#1a1a2e', secondary: 'rgba(0,0,0,0.6)' },
  success:    { main: '#2e7d32' },
  error:      { main: '#c62828' },
  warning:    { main: '#e65100' },
};

function buildTheme(palette: typeof darkPalette | typeof lightPalette) {
  const isDark = palette.mode === 'dark';
  return createTheme({
    palette,
    typography: {
      fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 }, h2: { fontWeight: 700 },
      h3: { fontWeight: 600 }, h4: { fontWeight: 600 },
      h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            backgroundImage: isDark
              ? `radial-gradient(circle at 50% 0%,${alpha(palette.primary.main,0.15)} 0%,transparent 50%),
                 radial-gradient(circle at 100% 0%,${alpha(palette.secondary.main,0.1)} 0%,transparent 50%)`
              : 'none',
            backgroundAttachment: 'fixed',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? alpha(palette.background.paper, 0.7)
              : palette.background.paper,
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            borderBottom: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
            backgroundImage: 'none',
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.1)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? alpha(palette.background.paper, 0.8) : palette.background.paper,
            backdropFilter: isDark ? 'blur(20px)' : 'none',
            borderRight: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.08)}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? alpha(palette.background.paper, 0.6) : palette.background.paper,
            backdropFilter: isDark ? 'blur(10px)' : 'none',
            border: `1px solid ${alpha(isDark ? '#fff' : '#000', 0.06)}`,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: `0 8px 32px 0 ${alpha('#000000', isDark ? 0.3 : 0.1)}`,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '8px 20px',
            boxShadow: 'none',
            '&:hover': { boxShadow: `0 0 15px ${alpha(palette.primary.main, 0.3)}` },
          },
          contained: {
            background: `linear-gradient(45deg,${palette.primary.dark},${palette.primary.main})`,
          },
          containedSecondary: {
            background: `linear-gradient(45deg,${palette.secondary.dark},${palette.secondary.main})`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(palette.primary.main, 0.15),
              '&:hover': { backgroundColor: alpha(palette.primary.main, 0.25) },
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.03),
              '& fieldset': { borderColor: alpha(isDark ? '#fff' : '#000', 0.15) },
              '&:hover fieldset': { borderColor: alpha(isDark ? '#fff' : '#000', 0.35) },
              '&.Mui-focused fieldset': { borderColor: palette.primary.main },
            },
          },
        },
      },
    },
  });
}

export const darkTheme  = buildTheme(darkPalette);
export const lightTheme = buildTheme(lightPalette);

// Backwards-compatible default export (dark)
export const theme = darkTheme;
