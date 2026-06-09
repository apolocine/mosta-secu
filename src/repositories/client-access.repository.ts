// ClientAccessRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { ClientAccessSchema } from '../schemas/client-access.schema.js';
import type { IDialect } from '@mostajs/orm';

export interface ClientAccessDTO {
  id: string;
  client: any;
  plan: any;
  activity: any;
  accessType: 'unlimited' | 'count' | 'temporal' | 'mixed';
  totalQuota: number | null;
  remainingQuota: number | null;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'expired' | 'blocked' | 'depleted';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class ClientAccessRepository extends BaseRepository<ClientAccessDTO> {
  constructor(dialect: IDialect) {
    super(ClientAccessSchema, dialect);
  }

  /** Find all accesses for a client with activity & plan populated */
  async findByClient(clientId: string): Promise<ClientAccessDTO[]> {
    return this.findWithRelations(
      { client: clientId },
      ['activity', 'plan'],
      { sort: { createdAt: -1 } },
    );
  }

  /** Find active access for a client + activity */
  async findActiveAccess(clientId: string, activityId: string): Promise<ClientAccessDTO | null> {
    return this.findOne({ client: clientId, activity: activityId, status: 'active' });
  }

  /** Find blocked access for a client + activity (for reactivation) */
  async findBlockedAccess(clientId: string, activityId: string): Promise<ClientAccessDTO | null> {
    return this.findOne({ client: clientId, activity: activityId, status: 'blocked' });
  }

  /** Decrement remaining quota by 1 */
  async decrementQuota(id: string): Promise<ClientAccessDTO | null> {
    return this.increment(id, 'remainingQuota', -1);
  }

  /** Soft-block an access */
  async block(id: string): Promise<ClientAccessDTO | null> {
    return this.update(id, { status: 'blocked' } as any);
  }
}
