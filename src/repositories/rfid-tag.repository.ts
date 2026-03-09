// RfidTagRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { RfidTagSchema } from '../schemas/rfid-tag.schema.js';
import type { IDialect, QueryOptions } from '@mostajs/orm';
import type { RfidTagDTO } from '../types/index.js';

export class RfidTagRepository extends BaseRepository<RfidTagDTO> {
  constructor(dialect: IDialect) {
    super(RfidTagSchema, dialect);
  }

  /** Find all tags with client and assignedBy populated */
  async findAllWithRelations(options?: QueryOptions): Promise<RfidTagDTO[]> {
    return this.findWithRelations(
      {},
      ['client', 'assignedBy'],
      { sort: { createdAt: -1 }, ...options },
    );
  }

  /** Find a tag by its unique tagId */
  async findByTagId(tagId: string): Promise<RfidTagDTO | null> {
    return this.findOne({ tagId });
  }

  /** Find active tag for a client */
  async findByClient(clientId: string): Promise<RfidTagDTO | null> {
    return this.findOne({ client: clientId, status: 'active' });
  }

  /** Assign tag to a client */
  async assign(id: string, clientId: string, assignedBy: string): Promise<RfidTagDTO | null> {
    return this.update(id, {
      client: clientId,
      status: 'active',
      assignedAt: new Date(),
      assignedBy,
    } as any);
  }

  /** Deactivate a tag */
  async deactivate(id: string): Promise<RfidTagDTO | null> {
    return this.update(id, {
      status: 'deactivated',
      deactivatedAt: new Date(),
    } as any);
  }

  /** Reactivate a tag (reset to available, clear assignment) */
  async reactivate(id: string): Promise<RfidTagDTO | null> {
    return this.update(id, {
      status: 'available',
      client: null,
      assignedAt: null,
      assignedBy: null,
      deactivatedAt: null,
    } as any);
  }

  /** Mark tag as lost */
  async markLost(id: string): Promise<RfidTagDTO | null> {
    return this.update(id, {
      status: 'lost',
      deactivatedAt: new Date(),
    } as any);
  }
}
