// SubscriptionPlanRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm';
import { SubscriptionPlanSchema } from '../schemas/subscription-plan.schema.js';
import type { IDialect } from '@mostajs/orm';

export interface PlanActivityDTO {
  activity: any;
  sessionsCount: number | null;
}

export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  description?: string;
  type: 'temporal' | 'usage' | 'mixed';
  duration: number | null;
  activities: PlanActivityDTO[];
  price: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class SubscriptionPlanRepository extends BaseRepository<SubscriptionPlanDTO> {
  constructor(dialect: IDialect) {
    super(SubscriptionPlanSchema, dialect);
  }

  /** Find all plans, newest first */
  async findAllWithActivities(): Promise<SubscriptionPlanDTO[]> {
    return this.findAll({}, { sort: { createdAt: -1 } });
  }

  /** Find active plans only */
  async findActive(): Promise<SubscriptionPlanDTO[]> {
    return this.findAll({ isActive: true }, { sort: { createdAt: -1 } });
  }
}
