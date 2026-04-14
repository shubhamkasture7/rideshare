import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import AppRoutes from './routes/AppRoutes';
import NotificationStack from './components/common/NotificationStack';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
        <NotificationStack />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
