/**
 * Cloud Functions Index
 * Exports all cloud functions for deployment
 */

// Telemetry Ingestion Functions
export {
  ingestTelemetry,
  ingestTelemetryBatch,
} from './telemetryIngestion';

// Score Calculation Functions
export {
  calculateSessionScore,
  calculateScoreHttp,
} from './scoreCalculation';

// Device Management Functions
export {
  registerDevice,
  deviceHeartbeat,
  sendDeviceCommand,
  getDeviceStatus,
  deactivateDevice,
} from './deviceManagement';
