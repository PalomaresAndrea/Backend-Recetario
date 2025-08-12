import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initTelemetry } from './lib/telemetry.js';
import app from './app.js';

(async () => {
  try {
    initTelemetry();
    await connectDB();
    const server = app.listen(config.port, () =>
      console.log(`🚀 API lista en http://0.0.0.0:${config.port}`)
    );

    // Apagado elegante
    const shutdown = () => {
      console.log('⏻ Cerrando servidor...');
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (e) {
    console.error('❌ No se pudo iniciar:', e);
    process.exit(1);
  }
})();
