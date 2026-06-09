// @mostajs/secu — Self-contained route handlers for runtime registration
// Author: Dr Hamid MADANI drmdh@msn.com
// Phase 5: Handlers are bare — permission checking is done by the catch-all.

import { getDialect } from '@mostajs/octoswitcher'
import { ClientRepository } from '../repositories/client.repository.js'
import { LockerRepository } from '../repositories/locker.repository.js'
import { RfidTagRepository } from '../repositories/rfid-tag.repository.js'
import { LockerEventRepository } from '../repositories/locker-event.repository.js'
import { ActivityRepository } from '../repositories/activity.repository.js'
import { ClientAccessRepository } from '../repositories/client-access.repository.js'
import { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository.js'
import { createClientsHandler } from '../api/clients.route.js'
import { createClientByIdHandler } from '../api/clients-id.route.js'
import { createClientSearchHandler } from '../api/clients-search.route.js'
import {
  createLockersHandler, createLockerAssignHandler, createLockerReleaseHandler,
  createLockerMaintenanceHandler, createLockerReportLossHandler,
  createLockerEventsHandler, createLockerByIdHandler, createLockerRfidLockHandler,
} from '../api/lockers.route.js'
import {
  createRfidTagsHandler, createRfidAssignHandler, createRfidDeactivateHandler,
  createRfidReplaceHandler, createRfidReactivateHandler,
} from '../api/rfid-tags.route.js'
import { createActivitiesHandler, createActivityByIdHandler } from '../api/activities.route.js'
import { createClientAccessHandler, createClientAccessByIdHandler } from '../api/client-access.route.js'
import { createSubscriptionPlansHandler, createSubscriptionPlanByIdHandler } from '../api/subscription-plans.route.js'

// No-op auth — the catch-all route handler enforces permissions.
const noAuth = async (_perm: string) => ({ error: null as never, userId: '', session: { user: {} } })

// Lazy repo factories using @mostajs/orm
const clientRepo = async () => new ClientRepository(await getDialect() as any)
const lockerRepo = async () => new LockerRepository(await getDialect() as any)
const rfidTagRepo = async () => new RfidTagRepository(await getDialect() as any)
const lockerEventRepo = async () => new LockerEventRepository(await getDialect() as any)
const activityRepo = async () => new ActivityRepository(await getDialect() as any)
const clientAccessRepo = async () => new ClientAccessRepository(await getDialect() as any)
const subscriptionPlanRepo = async () => new SubscriptionPlanRepository(await getDialect() as any)

// Shared config objects
const lockerConfig = {
  checkAuth: noAuth, getLockerRepo: lockerRepo, getLockerEventRepo: lockerEventRepo,
  getRfidTagRepo: rfidTagRepo, getClientRepo: clientRepo,
}
const rfidConfig = { checkAuth: noAuth, getRfidTagRepo: rfidTagRepo, getClientRepo: clientRepo }
const accessConfig = {
  checkAuth: noAuth, getClientAccessRepo: clientAccessRepo,
  getSubscriptionPlanRepo: subscriptionPlanRepo, getActivityRepo: activityRepo,
}

// ── Client handlers ───────────────────────────────────────────────────
const clients = createClientsHandler({ checkAuth: noAuth, getClientRepo: clientRepo })
const clientById = createClientByIdHandler({ checkAuth: noAuth, getClientRepo: clientRepo, getLockerRepo: lockerRepo })
const clientSearch = createClientSearchHandler({ checkAuth: noAuth, getClientRepo: clientRepo })

// ── Locker handlers ──────────────────────────────────────────────────
const lockers = createLockersHandler(lockerConfig)
const lockerAssign = createLockerAssignHandler(lockerConfig)
const lockerRelease = createLockerReleaseHandler(lockerConfig)
const lockerMaintenance = createLockerMaintenanceHandler(lockerConfig)
const lockerReportLoss = createLockerReportLossHandler(lockerConfig)
const lockerEvents = createLockerEventsHandler({ checkAuth: noAuth, getLockerEventRepo: lockerEventRepo })
const lockerById = createLockerByIdHandler({ checkAuth: noAuth, getLockerRepo: lockerRepo })
const lockerRfidLock = createLockerRfidLockHandler({ checkAuth: noAuth, getLockerRepo: lockerRepo })

// ── RFID handlers ────────────────────────────────────────────────────
const rfid = createRfidTagsHandler(rfidConfig)
const rfidAssign = createRfidAssignHandler(rfidConfig)
const rfidDeactivate = createRfidDeactivateHandler(rfidConfig)
const rfidReplace = createRfidReplaceHandler(rfidConfig)
const rfidReactivate = createRfidReactivateHandler(rfidConfig)

// ── Activity handlers ────────────────────────────────────────────────
const activities = createActivitiesHandler({ checkAuth: noAuth, getActivityRepo: activityRepo })
const activityById = createActivityByIdHandler({ checkAuth: noAuth, getActivityRepo: activityRepo })

// ── Client access handlers ───────────────────────────────────────────
const clientAccess = createClientAccessHandler(accessConfig)
const clientAccessById = createClientAccessByIdHandler({ checkAuth: noAuth, getClientAccessRepo: clientAccessRepo })

// ── Subscription plan handlers ───────────────────────────────────────
const subPlans = createSubscriptionPlansHandler({ checkAuth: noAuth, getSubscriptionPlanRepo: subscriptionPlanRepo, getActivityRepo: activityRepo })
const subPlanById = createSubscriptionPlanByIdHandler({ checkAuth: noAuth, getSubscriptionPlanRepo: subscriptionPlanRepo })

// ── Exports (RouteHandler-compatible) ────────────────────────────────
export const clientsHandlers = { GET: clients.GET as any, POST: clients.POST as any }
export const clientByIdHandlers = { GET: clientById.GET as any, PUT: clientById.PUT as any, DELETE: clientById.DELETE as any }
export const clientSearchHandlers = { GET: clientSearch.GET as any }

export const lockersHandlers = { GET: lockers.GET as any, POST: lockers.POST as any }
export const lockerAssignHandlers = { POST: lockerAssign.POST as any }
export const lockerReleaseHandlers = { POST: lockerRelease.POST as any }
export const lockerMaintenanceHandlers = { POST: lockerMaintenance.POST as any }
export const lockerReportLossHandlers = { POST: lockerReportLoss.POST as any }
export const lockerEventsHandlers = { GET: lockerEvents.GET as any }
export const lockerByIdHandlers = { DELETE: lockerById.DELETE as any }
export const lockerRfidLockHandlers = { PUT: lockerRfidLock.PUT as any }

export const rfidHandlers = { GET: rfid.GET as any, POST: rfid.POST as any }
export const rfidAssignHandlers = { POST: rfidAssign.POST as any }
export const rfidDeactivateHandlers = { POST: rfidDeactivate.POST as any }
export const rfidReplaceHandlers = { POST: rfidReplace.POST as any }
export const rfidReactivateHandlers = { POST: rfidReactivate.POST as any }

export const activitiesHandlers = { GET: activities.GET as any, POST: activities.POST as any }
export const activityByIdHandlers = { GET: activityById.GET as any, PUT: activityById.PUT as any, DELETE: activityById.DELETE as any }

export const clientAccessHandlers = { GET: clientAccess.GET as any, POST: clientAccess.POST as any }
export const clientAccessByIdHandlers = { PUT: clientAccessById.PUT as any, DELETE: clientAccessById.DELETE as any }

export const subscriptionPlansHandlers = { GET: subPlans.GET as any, POST: subPlans.POST as any }
export const subscriptionPlanByIdHandlers = { PUT: subPlanById.PUT as any, DELETE: subPlanById.DELETE as any }
