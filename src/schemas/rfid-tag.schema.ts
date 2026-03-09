// RfidTag Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const RfidTagSchema: EntitySchema = {
  name: 'RfidTag',
  collection: 'rfid_tags',
  timestamps: true,

  fields: {
    tagId:         { type: 'string', required: true, unique: true },
    status:        { type: 'string', enum: ['available', 'active', 'deactivated', 'lost'], default: 'available' },
    assignedAt:    { type: 'date', default: null },
    deactivatedAt: { type: 'date', default: null },
    notes:         { type: 'string' },
  },

  relations: {
    client:     { target: 'Client', type: 'one-to-one', nullable: true },
    assignedBy: { target: 'User', type: 'many-to-one', nullable: true },
  },

  indexes: [
    { fields: { status: 'asc' } },
    { fields: { client: 'asc' } },
  ],
};
