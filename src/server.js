// src/server.js
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

(async () => {
  try {
    // Telemetría opcional
    try {
      const tel = await import('./lib/telemetry.js');
      tel?.initTelemetry?.();
    } catch (e) {
      console.warn('ℹ️ Telemetry no disponible (ok):', e?.message || e);
    }

    // Levantar servidor YA
    const server = app.listen(config.port, () => {
      console.log(`🚀 API escuchando en http://0.0.0.0:${config.port}`);
    });

    // Conectar DB en background (con reintentos)
    connectDB({ retries: 20, intervalMs: 5000 });

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
