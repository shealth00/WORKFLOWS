import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { checkHealthConnect } from './health-connect-client';

// Check Health Connect availability on app launch if running on Android
if (window.Capacitor?.getPlatform() === 'android') {
  checkHealthConnect().catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
