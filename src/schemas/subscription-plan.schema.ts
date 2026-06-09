// SubscriptionPlan Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const SubscriptionPlanSchema: EntitySchema = {
  name: 'SubscriptionPlan',
  collection: 'subscription_plans',
  timestamps: true,

  fields: {
    name:        { type: 'string', required: true },
    description: { type: 'string' },
    type:        { type: 'string', enum: ['temporal', 'usage', 'mixed'], required: true },
    duration:    { type: 'number', default: null },
    activities:  {
      type: 'array',
      arrayOf: {
        kind: 'embedded',
        fields: {
          activity:      { type: 'string', required: true },
          sessionsCount: { type: 'number', default: null },
        },
      },
    },
    price:       { type: 'number', required: true },
    currency:    { type: 'string', default: 'DA' },
    isActive:    { type: 'boolean', default: true },
  },

  relations: {},

  indexes: [
    { fields: { isActive: 'asc' } },
  ],
};
