// Client Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm';

export const ClientSchema: EntitySchema = {
  name: 'Client',
  collection: 'clients',
  timestamps: true,

  fields: {
    clientNumber:   { type: 'string', unique: true, sparse: true },
    clientType:     { type: 'string', enum: ['abonne', 'visiteur'], required: true },
    firstName:      { type: 'string', required: true, trim: true },
    lastName:       { type: 'string', required: true, trim: true },
    phone:          { type: 'string', trim: true },
    email:          { type: 'string', lowercase: true, trim: true, sparse: true },
    dateOfBirth:    { type: 'date' },
    gender:         { type: 'string', enum: ['male', 'female'] },
    photo:          { type: 'string' },
    faceDescriptor: { type: 'array', arrayOf: 'number' },
    address:        { type: 'string' },
    wilaya:         { type: 'string' },
    qrCode:         { type: 'string', unique: true, sparse: true },
    status:         { type: 'string', enum: ['active', 'inactive', 'suspended'], default: 'active' },
    notes:          { type: 'string' },
  },

  relations: {
    rfidTagId: { target: 'RfidTag', type: 'one-to-one', nullable: true, select: ['tagId', 'status'] },
    createdBy: { target: 'User', type: 'many-to-one', required: true },
  },

  indexes: [
    { fields: { phone: 'asc' } },
    { fields: { status: 'asc' } },
    { fields: { clientType: 'asc' } },
    { fields: { firstName: 'text', lastName: 'text', phone: 'text', clientNumber: 'text' } },
  ],
};
