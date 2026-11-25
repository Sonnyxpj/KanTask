// Configuración de Metro.
// expo-sqlite (usado por 'expo-sqlite/localStorage/install' para la sesión y la caché) trae en web
// un worker que importa un archivo .wasm. Metro no lo reconoce por defecto y el bundle web falla con
// 'Unable to resolve "./wa-sqlite/wa-sqlite.wasm"'. Ver https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite importar archivos .wasm como assets.
config.resolver.assetExts.push('wasm');

// Encabezados COEP/COOP que SQLite necesita en web (SharedArrayBuffer) al usar `expo start`.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
