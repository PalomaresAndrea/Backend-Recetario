import { config } from '../config/env.js';

export async function initTelemetry() {
  if (!config.appInsights) return null; // si no hay conexión, no inicializamos

  try {
    const ai = await import('applicationinsights');          // CJS -> ESM dinámico
    const appInsights = ai.default ?? ai;                    // compat layer

    appInsights
      .setup(config.appInsights)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectConsole(true, true)
      .setSendLiveMetrics(false)
      .start();

    console.log('📈 Application Insights habilitado');
    return appInsights.defaultClient ?? null;
  } catch (e) {
    console.warn('ℹ️ Telemetry deshabilitado:', e?.message || e);
    return null;
  }
}
