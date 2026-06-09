// Activity Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const ActivitySchema: EntitySchema = {
  name: 'Activity',
  collection: 'activities',
  timestamps: true,

  fields: {
    name:               { type: 'string', required: true },
    slug:               { type: 'string', required: true, unique: true, lowercase: true },
    description:        { type: 'string' },
    icon:               { type: 'string' },
    color:              { type: 'string' },
    capacity:           { type: 'number' },
    currentOccupancy:   { type: 'number', default: 0 },
    schedule:           {
      type: 'array',
      arrayOf: {
        kind: 'embedded',
        fields: {
          dayOfWeek: { type: 'number', required: true },
          openTime:  { type: 'string', required: true },
          closeTime: { type: 'string', required: true },
          isOpen:    { type: 'boolean', default: true },
        },
      },
    },
    ticketValidityMode: { type: 'string', enum: ['day_reentry', 'single_use', 'time_slot', 'unlimited'], default: 'single_use' },
    ticketDuration:     { type: 'number', default: null },
    price:              { type: 'number', required: true, default: 0 },
    currency:           { type: 'string', default: 'DA' },
    status:             { type: 'string', enum: ['active', 'inactive', 'maintenance'], default: 'active' },
    sortOrder:          { type: 'number', default: 0 },
  },

  relations: {
    createdBy: { target: 'User', type: 'many-to-one', nullable: true },
  },

  indexes: [
    { fields: { status: 'asc' } },
  ],
};
