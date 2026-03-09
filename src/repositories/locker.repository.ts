// LockerRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { LockerSchema } from '../schemas/locker.schema.js';
import type { IDialect, QueryOptions } from '@mostajs/orm';
import type { LockerDTO } from '../types/index.js';

export class LockerRepository extends BaseRepository<LockerDTO> {
  constructor(dialect: IDialect) {
    super(LockerSchema, dialect);
  }

  /** Find all lockers with currentClient and currentTag populated */
  async findAllWithOccupants(options?: QueryOptions): Promise<LockerDTO[]> {
    return this.findWithRelations(
      {},
      ['currentClient', 'currentTag'],
      { sort: { zone: 1, number: 1 }, ...options },
    );
  }

  /** Find the locker currently occupied by a client */
  async findByClient(clientId: string): Promise<LockerDTO | null> {
    return this.findOne({ currentClient: clientId });
  }

  /** Count occupied lockers */
  async countOccupied(): Promise<number> {
    return this.count({ status: 'occupied' });
  }

  /** Count total lockers */
  async countTotal(): Promise<number> {
    return this.count();
  }

  /** Assign a client and tag to a locker */
  async assign(id: string, clientId: string, tagId: string | null): Promise<LockerDTO | null> {
    return this.update(id, {
      currentClient: clientId,
      currentTag: tagId || null,
      status: 'occupied',
      lastAssignedAt: new Date(),
    } as any);
  }

  /** Release a locker (clear client and tag) */
  async release(id: string): Promise<LockerDTO | null> {
    return this.update(id, {
      currentClient: null,
      currentTag: null,
      status: 'available',
    } as any);
  }

  /** Set locker to maintenance */
  async setMaintenance(id: string): Promise<LockerDTO | null> {
    return this.update(id, { status: 'maintenance' } as any);
  }

  /** End maintenance, return to available */
  async endMaintenance(id: string): Promise<LockerDTO | null> {
    return this.update(id, { status: 'available' } as any);
  }
}
