// @mostajs/secu — Runtime module registration
// Author: Dr Hamid MADANI drmdh@msn.com

import type { ModuleRegistration } from '@mostajs/socle'
import { ClientSchema } from './schemas/client.schema.js'
import { LockerSchema } from './schemas/locker.schema.js'
import { RfidTagSchema } from './schemas/rfid-tag.schema.js'
import { LockerEventSchema } from './schemas/locker-event.schema.js'
import { ActivitySchema } from './schemas/activity.schema.js'
import { ClientAccessSchema } from './schemas/client-access.schema.js'
import { SubscriptionPlanSchema } from './schemas/subscription-plan.schema.js'
import { ClientRepository } from './repositories/client.repository.js'
import { LockerRepository } from './repositories/locker.repository.js'
import { RfidTagRepository } from './repositories/rfid-tag.repository.js'
import { LockerEventRepository } from './repositories/locker-event.repository.js'
import { ActivityRepository } from './repositories/activity.repository.js'
import { ClientAccessRepository } from './repositories/client-access.repository.js'
import { SubscriptionPlanRepository } from './repositories/subscription-plan.repository.js'
import { secuMenuContribution } from './lib/menu.js'
import { SECU_PERMISSIONS, SECU_PERMISSION_DEFINITIONS, SECU_CATEGORY_DEFINITIONS } from './lib/permissions.js'
import { secuSeedFactory } from './lib/seeds.js'
import {
  clientsHandlers, clientByIdHandlers, clientSearchHandlers,
  lockersHandlers, lockerAssignHandlers, lockerReleaseHandlers,
  lockerMaintenanceHandlers, lockerReportLossHandlers, lockerEventsHandlers,
  lockerByIdHandlers, lockerRfidLockHandlers,
  rfidHandlers, rfidAssignHandlers, rfidDeactivateHandlers,
  rfidReplaceHandlers, rfidReactivateHandlers,
  activitiesHandlers, activityByIdHandlers,
  clientAccessHandlers, clientAccessByIdHandlers,
  subscriptionPlansHandlers, subscriptionPlanByIdHandlers,
} from './lib/route-handlers.js'
import ClientsPage from './pages/ClientsPage.js'
import ClientDetailPage from './pages/ClientDetailPage.js'
import ClientEditPage from './pages/ClientEditPage.js'
import ClientNewPage from './pages/ClientNewPage.js'
import LockersPage from './pages/LockersPage.js'
import RfidPage from './pages/RfidPage.js'
import ActivitiesPage from './pages/ActivitiesPage.js'
import PlansPage from './pages/PlansPage.js'

/**
 * SecuAccess — business module for access control.
 * 7 schemas, 7 repos, 22 permissions, 3 roles, seeds, menu, routes, pages.
 */
export function register(registry: { register(r: ModuleRegistration): void }): void {
  registry.register({
    manifest: {
      name: 'secu',
      package: '@mostajs/secu',
      version: '2.0.0',
      type: 'business',
      priority: 100,
      dependencies: ['auth', 'audit'],
      displayName: 'SecuAccess',
      description: 'Access control — clients, lockers, RFID, activities, plans, reception',
      icon: 'Shield',
      register: './dist/register.js',
    },

    schemas: [
      { name: 'Client', schema: ClientSchema },
      { name: 'Locker', schema: LockerSchema },
      { name: 'RfidTag', schema: RfidTagSchema },
      { name: 'LockerEvent', schema: LockerEventSchema },
      { name: 'Activity', schema: ActivitySchema },
      { name: 'ClientAccess', schema: ClientAccessSchema },
      { name: 'SubscriptionPlan', schema: SubscriptionPlanSchema },
    ],

    repositories: {
      clientRepo: (dialect: unknown) => new ClientRepository(dialect as never),
      lockerRepo: (dialect: unknown) => new LockerRepository(dialect as never),
      rfidTagRepo: (dialect: unknown) => new RfidTagRepository(dialect as never),
      lockerEventRepo: (dialect: unknown) => new LockerEventRepository(dialect as never),
      activityRepo: (dialect: unknown) => new ActivityRepository(dialect as never),
      clientAccessRepo: (dialect: unknown) => new ClientAccessRepository(dialect as never),
      subscriptionPlanRepo: (dialect: unknown) => new SubscriptionPlanRepository(dialect as never),
    },

    permissions: {
      permissions: SECU_PERMISSIONS,
      definitions: SECU_PERMISSION_DEFINITIONS,
      categories: SECU_CATEGORY_DEFINITIONS,
    },

    roles: [
      {
        name: 'agent_accueil',
        displayName: 'Agent d\'accueil',
        description: 'Gestion des clients, casiers et cartes RFID',
        permissions: [
          SECU_PERMISSIONS.CLIENT_VIEW, SECU_PERMISSIONS.CLIENT_CREATE, SECU_PERMISSIONS.CLIENT_UPDATE, SECU_PERMISSIONS.CLIENT_SEARCH,
          SECU_PERMISSIONS.ACCESS_VIEW, SECU_PERMISSIONS.ACCESS_CREATE,
          SECU_PERMISSIONS.LOCKER_VIEW, SECU_PERMISSIONS.LOCKER_ASSIGN, SECU_PERMISSIONS.LOCKER_RELEASE,
          SECU_PERMISSIONS.RFID_VIEW, SECU_PERMISSIONS.RFID_PROGRAM, SECU_PERMISSIONS.RFID_DEACTIVATE,
          SECU_PERMISSIONS.DASHBOARD_STATS,
        ],
      },
      {
        name: 'agent_attraction',
        displayName: 'Agent d\'attraction',
        description: 'Validation des acces et scan des tickets',
        permissions: [
          SECU_PERMISSIONS.CLIENT_VIEW, SECU_PERMISSIONS.CLIENT_SEARCH,
          SECU_PERMISSIONS.ACCESS_VIEW,
          SECU_PERMISSIONS.ACTIVITY_VIEW,
          SECU_PERMISSIONS.DASHBOARD_STATS,
        ],
      },
      {
        name: 'superviseur',
        displayName: 'Superviseur',
        description: 'Supervision complete du centre',
        permissions: Object.values(SECU_PERMISSIONS),
      },
    ],

    seeds: secuSeedFactory,

    routes: [
      // Clients — static routes BEFORE dynamic [id]
      { path: 'clients', handlers: clientsHandlers, permission: { GET: 'client:view', POST: 'client:create' } },
      { path: 'clients/search', handlers: clientSearchHandlers, permission: 'client:search' },
      { path: 'clients/[id]/access/[accessId]', handlers: clientAccessByIdHandlers, permission: { PUT: 'access:update', DELETE: 'access:revoke' } },
      { path: 'clients/[id]/access', handlers: clientAccessHandlers, permission: { GET: 'access:view', POST: 'access:create' } },
      { path: 'clients/[id]', handlers: clientByIdHandlers, permission: { GET: 'client:view', PUT: 'client:update', DELETE: 'client:delete' } },
      // Lockers — static routes BEFORE dynamic [id]
      { path: 'lockers', handlers: lockersHandlers, permission: { GET: 'locker:view', POST: 'locker:manage' } },
      { path: 'lockers/assign', handlers: lockerAssignHandlers, permission: 'locker:assign' },
      { path: 'lockers/release', handlers: lockerReleaseHandlers, permission: 'locker:release' },
      { path: 'lockers/maintenance', handlers: lockerMaintenanceHandlers, permission: 'locker:manage' },
      { path: 'lockers/report-loss', handlers: lockerReportLossHandlers, permission: 'locker:manage' },
      { path: 'lockers/events', handlers: lockerEventsHandlers, permission: 'locker:view' },
      { path: 'lockers/[id]/rfid-lock', handlers: lockerRfidLockHandlers, permission: 'locker:manage' },
      { path: 'lockers/[id]', handlers: lockerByIdHandlers, permission: 'locker:manage' },
      // RFID
      { path: 'rfid', handlers: rfidHandlers, permission: { GET: 'rfid:view', POST: 'rfid:program' } },
      { path: 'rfid/assign', handlers: rfidAssignHandlers, permission: 'rfid:program' },
      { path: 'rfid/deactivate', handlers: rfidDeactivateHandlers, permission: 'rfid:deactivate' },
      { path: 'rfid/reactivate', handlers: rfidReactivateHandlers, permission: 'rfid:program' },
      { path: 'rfid/replace', handlers: rfidReplaceHandlers, permission: 'rfid:program' },
      // Activities
      { path: 'activities', handlers: activitiesHandlers, permission: { GET: 'activity:view', POST: 'activity:create' } },
      { path: 'activities/[id]', handlers: activityByIdHandlers, permission: { GET: 'activity:view', PUT: 'activity:update', DELETE: 'activity:delete' } },
      // Subscription plans
      { path: 'subscription-plans', handlers: subscriptionPlansHandlers, permission: { GET: 'access:view', POST: 'admin:access' } },
      { path: 'subscription-plans/[id]', handlers: subscriptionPlanByIdHandlers, permission: { PUT: 'admin:access', DELETE: 'admin:access' } },
    ],

    pages: [
      { path: 'clients', component: ClientsPage, permission: 'client:view' },
      { path: 'clients/new', component: ClientNewPage, permission: 'client:create' },
      { path: 'clients/[id]', component: ClientDetailPage, permission: 'client:view' },
      { path: 'clients/[id]/edit', component: ClientEditPage, permission: 'client:update' },
      { path: 'lockers', component: LockersPage, permission: 'locker:view' },
      { path: 'rfid', component: RfidPage, permission: 'rfid:view' },
      { path: 'activities', component: ActivitiesPage, permission: 'activity:view' },
      { path: 'plans', component: PlansPage, permission: 'access:view' },
    ],

    menu: secuMenuContribution,

    i18n: [
      { namespace: 'clients', source: 'node_modules/@mostajs/secu/i18n/fr/clients.json' },
      { namespace: 'lockers', source: 'node_modules/@mostajs/secu/i18n/fr/lockers.json' },
      { namespace: 'rfid', source: 'node_modules/@mostajs/secu/i18n/fr/rfid.json' },
      { namespace: 'access', source: 'node_modules/@mostajs/secu/i18n/fr/access.json' },
      { namespace: 'activities', source: 'node_modules/@mostajs/secu/i18n/fr/activities.json' },
      { namespace: 'reception', source: 'node_modules/@mostajs/secu/i18n/fr/reception.json' },
    ],
  })
}
