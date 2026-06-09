// @mostajs/secu — Subscription plans handler factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository.js';
import type { ActivityRepository } from '../repositories/activity.repository.js';

export interface SubscriptionPlansHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getSubscriptionPlanRepo: () => Promise<SubscriptionPlanRepository>;
  getActivityRepo: () => Promise<ActivityRepository>;
}

export function createSubscriptionPlansHandler(config: SubscriptionPlansHandlerConfig) {
  const { checkAuth, getSubscriptionPlanRepo, getActivityRepo } = config;

  async function GET() {
    const { error } = await checkAuth('access:view');
    if (error) return error;

    const repo = await getSubscriptionPlanRepo();
    const plans = await repo.findAll({}, { sort: { createdAt: -1 } });

    // Populate activities[].activity
    const aRepo = await getActivityRepo();
    const allActivities = await aRepo.findAll({}, { select: ['name', 'slug'] });
    const actMap = new Map(allActivities.map((a) => [a.id, a]));

    const populated = plans.map((plan: any) => ({
      ...plan,
      activities: (plan.activities || []).map((entry: any) => {
        const actId = typeof entry.activity === 'object' ? entry.activity?.id || entry.activity : entry.activity;
        const act = actMap.get(actId);
        return {
          ...entry,
          activity: act ? { id: act.id, name: act.name, slug: act.slug } : { id: actId, name: actId },
        };
      }),
    }));

    return NextResponse.json({ data: populated });
  }

  async function POST(req: NextRequest) {
    const { error } = await checkAuth('admin:access');
    if (error) return error;

    const body = await req.json();
    if (!body.name || !body.type || body.price === undefined) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'name, type et price requis' } },
        { status: 400 },
      );
    }

    const repo = await getSubscriptionPlanRepo();
    const plan = await repo.create(body as any);
    return NextResponse.json({ data: plan }, { status: 201 });
  }

  return { GET, POST };
}

export function createSubscriptionPlanByIdHandler(config: Pick<SubscriptionPlansHandlerConfig, 'checkAuth' | 'getSubscriptionPlanRepo'>) {
  const { checkAuth, getSubscriptionPlanRepo } = config;

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('admin:access');
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const repo = await getSubscriptionPlanRepo();
    const plan = await repo.update(id, body);
    if (!plan) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 });
    }
    return NextResponse.json({ data: plan });
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('admin:access');
    if (error) return error;

    const { id } = await params;
    const repo = await getSubscriptionPlanRepo();
    const deleted = await repo.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 });
    }
    return NextResponse.json({ data: { message: 'Plan supprimé' } });
  }

  return { PUT, DELETE };
}
