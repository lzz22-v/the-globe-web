if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[PWA] Falha ao registrar Service Worker:', err));
}