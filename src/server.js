// src/server.js
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

(async () => {
  try {
    // Telemetría opcional (no truena si no existe)
    try {
      const tel = await import('./lib/telemetry.js').catch(() => null);
      tel?.initTelemetry?.();
    } catch (e) {
      console.warn('ℹ️ Telemetry no disponible (ok):', e?.message || e);
    }

    // === Echo de configuración (útil para Azure Log Stream) ===
    console.log('[CFG] PORT:', config.port);
    console.log('[CFG] CORS_ORIGINS:', process.env.CORS_ORIGINS || config.corsOrigins || '(empty)');
    console.log('[CFG] MONGO_URI presente?:', Boolean(process.env.MONGO_URI));

    // Conexión a DB
    await connectDB();

    // Levantar servidor
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`🚀 API lista en http://0.0.0.0:${config.port}`);
    });

    // Apagado elegante + manejo de errores globales
    const shutdown = (signal = 'shutdown') => {
      console.log(`⏻ Recibido ${signal}. Cerrando servidor...`);
      server.close(() => {
        console.log('✅ Servidor cerrado.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('⚠️ Forzando salida tras 10s');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      console.error('💥 unhandledRejection:', reason);
      shutdown('unhandledRejection');
    });
    process.on('uncaughtException', (err) => {
      console.error('💥 uncaughtException:', err);
      shutdown('uncaughtException');
    });
  } catch (e) {
    console.error('❌ No se pudo iniciar:', e);
    process.exit(1);
  }
})();
