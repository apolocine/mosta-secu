// ActivityRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { ActivitySchema } from '../schemas/activity.schema.js';
import type { IDialect, QueryOptions } from '@mostajs/orm';

export interface ActivityScheduleDTO {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface ActivityDTO {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  capacity?: number;
  currentOccupancy: number;
  schedule: ActivityScheduleDTO[];
  ticketValidityMode: 'day_reentry' | 'single_use' | 'time_slot' | 'unlimited';
  ticketDuration: number | null;
  price: number;
  currency: string;
  status: 'active' | 'inactive' | 'maintenance';
  sortOrder: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export class ActivityRepository extends BaseRepository<ActivityDTO> {
  constructor(dialect: IDialect) {
    super(ActivitySchema, dialect);
  }

  /** Find all sorted by sortOrder then name */
  async findAllOrdered(): Promise<ActivityDTO[]> {
    return this.findAll({}, { sort: { sortOrder: 1, name: 1 } });
  }

  /** Find by slug (unique) */
  async findBySlug(slug: string): Promise<ActivityDTO | null> {
    return this.findOne({ slug });
  }

  /** Find active activities only */
  async findActive(): Promise<ActivityDTO[]> {
    return this.findAll({ status: 'active' }, { sort: { sortOrder: 1 } });
  }
}
