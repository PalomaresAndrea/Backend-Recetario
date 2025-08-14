// src/server.js
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

(async () => {
  try {
    // Telemetría opcional (no truena si el archivo no existe)
    try {
      const tel = await import('./lib/telemetry.js'); // si no existe, entra al catch
      tel?.initTelemetry?.();
    } catch (e) {
      console.warn('ℹ️ Telemetry no disponible (ok):', e?.message || e);
    }

    // Conexión a DB
    await connectDB();

    // Levantar servidor
    const server = app.listen(config.port, () => {
      console.log(`🚀 API lista en http://0.0.0.0:${config.port}`);
    });

    // Apagado elegante
    const shutdown = () => {
      console.log('⏻ Cerrando servidor...');
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (e) {
    console.error('❌ No se pudo iniciar:', e);
    process.exit(1);
  }
})();
