// LockerEvent Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const LockerEventSchema: EntitySchema = {
  name: 'LockerEvent',
  collection: 'locker_events',
  timestamps: false,

  fields: {
    eventType: {
      type: 'string',
      enum: ['assigned', 'released', 'tag_lost', 'maintenance_start', 'maintenance_end'],
      required: true,
    },
    notes:     { type: 'string' },
    timestamp: { type: 'date', default: 'now' },
  },

  relations: {
    locker:      { target: 'Locker', type: 'many-to-one', required: true },
    client:      { target: 'Client', type: 'many-to-one', nullable: true },
    rfidTag:     { target: 'RfidTag', type: 'many-to-one', nullable: true },
    performedBy: { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { locker: 'asc' } },
    { fields: { timestamp: 'desc' } },
  ],
};
