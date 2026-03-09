// @mostajs/secu — Main barrel exports
// Author: Dr Hamid MADANI drmdh@msn.com

// ============================================================
// Schemas
// ============================================================
export { ClientSchema } from './schemas/client.schema.js';
export { LockerSchema } from './schemas/locker.schema.js';
export { RfidTagSchema } from './schemas/rfid-tag.schema.js';
export { LockerEventSchema } from './schemas/locker-event.schema.js';

// ============================================================
// Repositories
// ============================================================
export { ClientRepository } from './repositories/client.repository.js';
export { LockerRepository } from './repositories/locker.repository.js';
export { RfidTagRepository } from './repositories/rfid-tag.repository.js';
export { LockerEventRepository } from './repositories/locker-event.repository.js';

// ============================================================
// Types
// ============================================================
export type {
  ClientDTO,
  LockerDTO,
  RfidTagDTO,
  LockerEventDTO,
  SecuAuthResult,
  SecuHandlerConfig,
  ClientsHandlerConfig,
  ClientByIdHandlerConfig,
  LockersHandlerConfig,
  RfidTagsHandlerConfig,
  IdentifyHandlerConfig,
} from './types/index.js';

// ============================================================
// API Route Factories
// ============================================================
export { createClientsHandler } from './api/clients.route.js';
export { createClientByIdHandler } from './api/clients-id.route.js';
export { createClientSearchHandler } from './api/clients-search.route.js';
export {
  createLockersHandler,
  createLockerAssignHandler,
  createLockerReleaseHandler,
  createLockerMaintenanceHandler,
  createLockerReportLossHandler,
  createLockerEventsHandler,
} from './api/lockers.route.js';
export {
  createRfidTagsHandler,
  createRfidAssignHandler,
  createRfidDeactivateHandler,
  createRfidReplaceHandler,
} from './api/rfid-tags.route.js';
export { createIdentifyHandler } from './api/identify.route.js';

// ============================================================
// Permissions
// ============================================================
export { SECU_PERMISSIONS, SECU_PERMISSION_DEFINITIONS, SECU_CATEGORY_DEFINITIONS } from './lib/permissions.js';
export type { SecuPermission } from './lib/permissions.js';
