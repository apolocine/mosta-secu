// Locker Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const LockerSchema: EntitySchema = {
  name: 'Locker',
  collection: 'lockers',
  timestamps: true,

  fields: {
    number:         { type: 'number', required: true, unique: true },
    zone:           { type: 'string', enum: ['A', 'B', 'C'], required: true },
    status:         { type: 'string', enum: ['available', 'occupied', 'maintenance', 'out_of_order'], default: 'available' },
    rfidLockId:     { type: 'string' },
    lastAssignedAt: { type: 'date', default: null },
  },

  relations: {
    currentClient: { target: 'Client', type: 'one-to-one', nullable: true, select: ['clientNumber', 'firstName', 'lastName'] },
    currentTag:    { target: 'RfidTag', type: 'one-to-one', nullable: true, select: ['tagId'] },
  },

  indexes: [
    { fields: { zone: 'asc' } },
    { fields: { status: 'asc' } },
  ],
};
