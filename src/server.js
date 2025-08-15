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

    // Marca de readiness de DB
    app.locals.dbReady = false;

    // Levantar servidor HTTP primero (para que /health responda)
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`[CFG] PORT: ${config.port}`);
      console.log('[CFG] CORS_ORIGINS:', process.env.CORS_ORIGINS || '(empty)');
      console.log('[CFG] MONGO_URI presente?:', Boolean(process.env.MONGO_URI));
      console.log(`🚀 API escuchando en http://0.0.0.0:${config.port}`);
    });

    // Conexión a DB con reintentos (no tumba el proceso)
    const tryConnect = async () => {
      try {
        await connectDB();
        app.locals.dbReady = true;
        console.log('✅ DB ready');
      } catch (e) {
        app.locals.dbReady = false;
        console.error('⚠️ DB no conectó, reintento en 5s:', e?.message || e);
        setTimeout(tryConnect, 5000);
      }
    };
    tryConnect();

    // Apagado elegante + errores globales
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
    process.on('unhandledRejection', (reason) => { console.error('💥 unhandledRejection:', reason); shutdown('unhandledRejection'); });
    process.on('uncaughtException', (err) => { console.error('💥 uncaughtException:', err); shutdown('uncaughtException'); });

  } catch (e) {
    console.error('❌ No se pudo iniciar:', e);
    process.exit(1);
  }
})();
