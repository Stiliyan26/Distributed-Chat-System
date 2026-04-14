import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const stored = localStorage.getItem('nexus_theme');
const initialTheme = stored === 'light' || stored === 'dark' ? stored : 'dark';
document.documentElement.setAttribute('data-theme', initialTheme);
document.documentElement.classList.toggle('dark', initialTheme === 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
