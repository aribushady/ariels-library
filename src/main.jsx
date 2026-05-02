import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
  caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
}

function purgeFileInputs() {
  document.querySelectorAll('input[type="file"]').forEach((el) => el.remove());
}

purgeFileInputs();
setTimeout(purgeFileInputs, 100);
setTimeout(purgeFileInputs, 500);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    purgeFileInputs();
    setTimeout(purgeFileInputs, 200);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
