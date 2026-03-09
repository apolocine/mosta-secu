// @mostajs/secu — Permission constants
// Author: Dr Hamid MADANI drmdh@msn.com

export const SECU_PERMISSIONS = {
  // Clients
  CLIENT_VIEW:    'client:view',
  CLIENT_CREATE:  'client:create',
  CLIENT_UPDATE:  'client:update',
  CLIENT_DELETE:  'client:delete',
  CLIENT_SEARCH:  'client:search',

  // Activities
  ACTIVITY_VIEW:   'activity:view',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',

  // Access management (abonnements / plans)
  ACCESS_VIEW:    'access:view',
  ACCESS_CREATE:  'access:create',
  ACCESS_UPDATE:  'access:update',
  ACCESS_REVOKE:  'access:revoke',

  // Lockers (casiers)
  LOCKER_VIEW:    'locker:view',
  LOCKER_ASSIGN:  'locker:assign',
  LOCKER_RELEASE: 'locker:release',
  LOCKER_MANAGE:  'locker:manage',

  // RFID Tags
  RFID_VIEW:       'rfid:view',
  RFID_PROGRAM:    'rfid:program',
  RFID_DEACTIVATE: 'rfid:deactivate',
  RFID_REPLACE:    'rfid:replace',

  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
} as const;

export type SecuPermission = typeof SECU_PERMISSIONS[keyof typeof SECU_PERMISSIONS];

export const SECU_PERMISSION_DEFINITIONS = [
  // Clients
  { code: SECU_PERMISSIONS.CLIENT_VIEW, name: 'client:view', description: 'Voir la liste des clients', category: 'client' },
  { code: SECU_PERMISSIONS.CLIENT_CREATE, name: 'client:create', description: 'Creer un client', category: 'client' },
  { code: SECU_PERMISSIONS.CLIENT_UPDATE, name: 'client:update', description: 'Modifier un client', category: 'client' },
  { code: SECU_PERMISSIONS.CLIENT_DELETE, name: 'client:delete', description: 'Supprimer un client', category: 'client' },
  { code: SECU_PERMISSIONS.CLIENT_SEARCH, name: 'client:search', description: 'Rechercher des clients', category: 'client' },

  // Activities
  { code: SECU_PERMISSIONS.ACTIVITY_VIEW, name: 'activity:view', description: 'Voir les activites', category: 'activity' },
  { code: SECU_PERMISSIONS.ACTIVITY_CREATE, name: 'activity:create', description: 'Creer une activite', category: 'activity' },
  { code: SECU_PERMISSIONS.ACTIVITY_UPDATE, name: 'activity:update', description: 'Modifier une activite', category: 'activity' },
  { code: SECU_PERMISSIONS.ACTIVITY_DELETE, name: 'activity:delete', description: 'Supprimer une activite', category: 'activity' },

  // Access (abonnements / plans)
  { code: SECU_PERMISSIONS.ACCESS_VIEW, name: 'access:view', description: 'Voir les acces client', category: 'access' },
  { code: SECU_PERMISSIONS.ACCESS_CREATE, name: 'access:create', description: 'Attribuer un acces', category: 'access' },
  { code: SECU_PERMISSIONS.ACCESS_UPDATE, name: 'access:update', description: 'Modifier un acces', category: 'access' },
  { code: SECU_PERMISSIONS.ACCESS_REVOKE, name: 'access:revoke', description: 'Revoquer un acces', category: 'access' },

  // Lockers (casiers)
  { code: SECU_PERMISSIONS.LOCKER_VIEW, name: 'locker:view', description: 'Voir les casiers', category: 'locker' },
  { code: SECU_PERMISSIONS.LOCKER_ASSIGN, name: 'locker:assign', description: 'Attribuer un casier', category: 'locker' },
  { code: SECU_PERMISSIONS.LOCKER_RELEASE, name: 'locker:release', description: 'Liberer un casier', category: 'locker' },
  { code: SECU_PERMISSIONS.LOCKER_MANAGE, name: 'locker:manage', description: 'Gerer les casiers (maintenance)', category: 'locker' },

  // RFID
  { code: SECU_PERMISSIONS.RFID_VIEW, name: 'rfid:view', description: 'Voir les tags RFID', category: 'rfid' },
  { code: SECU_PERMISSIONS.RFID_PROGRAM, name: 'rfid:program', description: 'Programmer un tag RFID', category: 'rfid' },
  { code: SECU_PERMISSIONS.RFID_DEACTIVATE, name: 'rfid:deactivate', description: 'Desactiver un tag RFID', category: 'rfid' },
  { code: SECU_PERMISSIONS.RFID_REPLACE, name: 'rfid:replace', description: 'Remplacer un tag RFID', category: 'rfid' },

  // Dashboard
  { code: SECU_PERMISSIONS.DASHBOARD_STATS, name: 'dashboard:stats', description: 'Voir les statistiques du tableau de bord', category: 'dashboard' },
];

export const SECU_CATEGORY_DEFINITIONS = [
  { name: 'client', label: 'Clients', description: 'Gestion des clients et visiteurs', icon: 'UserCheck', order: 2, system: true },
  { name: 'activity', label: 'Activites', description: 'Gestion des activites du centre', icon: 'Dumbbell', order: 3, system: true },
  { name: 'access', label: 'Abonnements', description: 'Gestion des abonnements et plans d\'acces', icon: 'Key', order: 4, system: true },
  { name: 'locker', label: 'Casiers', description: 'Gestion des casiers et vestiaires', icon: 'DoorOpen', order: 5, system: true },
  { name: 'rfid', label: 'RFID', description: 'Gestion des tags et cartes RFID', icon: 'CreditCard', order: 6, system: true },
];
