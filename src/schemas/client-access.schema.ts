// ClientAccess Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const ClientAccessSchema: EntitySchema = {
  name: 'ClientAccess',
  collection: 'client_accesses',
  timestamps: true,

  fields: {
    accessType:     { type: 'string', enum: ['unlimited', 'count', 'temporal', 'mixed'], required: true },
    totalQuota:     { type: 'number', default: null },
    remainingQuota: { type: 'number', default: null },
    startDate:      { type: 'date', required: true },
    endDate:        { type: 'date', default: null },
    status:         { type: 'string', enum: ['active', 'expired', 'blocked', 'depleted'], default: 'active' },
  },

  relations: {
    client:    { target: 'Client', type: 'many-to-one', required: true },
    plan:      { target: 'SubscriptionPlan', type: 'many-to-one', nullable: true },
    activity:  { target: 'Activity', type: 'many-to-one', required: true },
    createdBy: { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { client: 'asc', activity: 'asc' } },
    { fields: { client: 'asc', status: 'asc' } },
    { fields: { status: 'asc' } },
  ],
};
