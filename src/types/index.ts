// @mostajs/secu — Type definitions
// Author: Dr Hamid MADANI drmdh@msn.com

export interface ClientDTO {
  id: string;
  clientNumber: string;
  clientType: 'abonne' | 'visiteur';
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  photo?: string;
  faceDescriptor?: number[];
  address?: string;
  wilaya?: string;
  qrCode: string;
  rfidTagId?: any;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LockerDTO {
  id: string;
  number: number;
  zone: 'A' | 'B' | 'C';
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  currentClient: any;
  currentTag: any;
  rfidLockId: string | null;
  lastAssignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RfidTagDTO {
  id: string;
  tagId: string;
  client: any;
  assignedBy: any;
  status: 'available' | 'active' | 'deactivated' | 'lost';
  assignedAt: string | null;
  deactivatedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LockerEventDTO {
  id: string;
  locker: any;
  client: any;
  rfidTag: any;
  performedBy: any;
  eventType: 'assigned' | 'released' | 'tag_lost' | 'maintenance_start' | 'maintenance_end';
  notes: string | null;
  timestamp: string;
}

// ============================================================
// Factory config types for API route handlers
// ============================================================

export interface SecuAuthResult {
  error: Response | null;
  userId: string;
  session?: any;
}

export interface SecuHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  logAudit?: (entry: Record<string, unknown>) => Promise<void>;
  getAuditUser?: (session: any) => Record<string, unknown>;
}

export interface ClientsHandlerConfig extends SecuHandlerConfig {
  getClientRepo: () => Promise<import('../repositories/client.repository.js').ClientRepository>;
}

export interface ClientByIdHandlerConfig extends SecuHandlerConfig {
  getClientRepo: () => Promise<import('../repositories/client.repository.js').ClientRepository>;
}

export interface LockersHandlerConfig extends SecuHandlerConfig {
  getLockerRepo: () => Promise<import('../repositories/locker.repository.js').LockerRepository>;
  getLockerEventRepo: () => Promise<import('../repositories/locker-event.repository.js').LockerEventRepository>;
  getRfidTagRepo: () => Promise<import('../repositories/rfid-tag.repository.js').RfidTagRepository>;
}

export interface RfidTagsHandlerConfig extends SecuHandlerConfig {
  getRfidTagRepo: () => Promise<import('../repositories/rfid-tag.repository.js').RfidTagRepository>;
}

export interface IdentifyHandlerConfig extends SecuHandlerConfig {
  getClientRepo: () => Promise<import('../repositories/client.repository.js').ClientRepository>;
  getTicketRepo?: () => Promise<any>;
}
