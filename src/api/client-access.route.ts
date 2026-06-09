// @mostajs/secu — Client access handler factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ClientAccessRepository } from '../repositories/client-access.repository.js';
import type { SubscriptionPlanRepository } from '../repositories/subscription-plan.repository.js';
import type { ActivityRepository } from '../repositories/activity.repository.js';

export interface ClientAccessHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getClientAccessRepo: () => Promise<ClientAccessRepository>;
  getSubscriptionPlanRepo: () => Promise<SubscriptionPlanRepository>;
  getActivityRepo: () => Promise<ActivityRepository>;
}

export function createClientAccessHandler(config: ClientAccessHandlerConfig) {
  const { checkAuth, getClientAccessRepo, getActivityRepo } = config;

  async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('access:view');
    if (error) return error;

    const { id } = await params;
    const caRepo = await getClientAccessRepo();
    const accesses = await caRepo.findByClient(id);

    const aRepo = await getActivityRepo();
    const activities = await aRepo.findActive();

    return NextResponse.json({ data: { accesses, activities } });
  }

  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error, session } = await checkAuth('access:create');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const { id: clientId } = await params;
    const body = await req.json();
    const { planId, activityId, accessType, totalQuota, durationDays } = body;

    const caRepo = await getClientAccessRepo();

    // Assign via plan
    if (planId) {
      const { getSubscriptionPlanRepo } = config;
      const spRepo = await getSubscriptionPlanRepo();
      const plan = await spRepo.findById(planId);
      if (!plan) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan non trouvé' } }, { status: 404 });
      }

      const createdAccesses = [];
      for (const planActivity of plan.activities) {
        const actId = typeof planActivity.activity === 'object' ? (planActivity.activity as any).id || planActivity.activity : planActivity.activity;

        const existing = await caRepo.findActiveAccess(clientId, actId);
        if (existing) continue;

        const blocked = await caRepo.findBlockedAccess(clientId, actId);

        let at: string = 'unlimited';
        let tq: number | null = null;
        let endDate: Date | null = null;

        if (plan.type === 'temporal') {
          at = 'temporal';
          endDate = plan.duration ? new Date(Date.now() + plan.duration * 86400000) : null;
        } else if (plan.type === 'usage') {
          at = 'count';
          tq = planActivity.sessionsCount;
        } else if (plan.type === 'mixed') {
          at = 'mixed';
          tq = planActivity.sessionsCount;
          endDate = plan.duration ? new Date(Date.now() + plan.duration * 86400000) : null;
        }

        if (blocked) {
          const reactivated = await caRepo.update(blocked.id, {
            plan: planId, accessType: at, totalQuota: tq, remainingQuota: tq,
            startDate: new Date(), endDate, status: 'active',
          } as any);
          createdAccesses.push(reactivated);
        } else {
          const access = await caRepo.create({
            client: clientId, plan: planId, activity: actId, accessType: at,
            totalQuota: tq, remainingQuota: tq, startDate: new Date(), endDate,
            status: 'active', createdBy: userId,
          } as any);
          createdAccesses.push(access);
        }
      }

      return NextResponse.json({ data: createdAccesses }, { status: 201 });
    }

    // Manual assignment (single activity)
    if (activityId && accessType) {
      const existing = await caRepo.findActiveAccess(clientId, activityId);
      if (existing) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE', message: 'Accès déjà attribué pour cette activité' } },
          { status: 409 },
        );
      }

      const endDate = durationDays ? new Date(Date.now() + durationDays * 86400000) : null;

      const blocked = await caRepo.findBlockedAccess(clientId, activityId);
      if (blocked) {
        const reactivated = await caRepo.update(blocked.id, {
          accessType, totalQuota: totalQuota || null, remainingQuota: totalQuota || null,
          startDate: new Date(), endDate, status: 'active',
        } as any);
        return NextResponse.json({ data: reactivated });
      }

      const access = await caRepo.create({
        client: clientId, plan: null, activity: activityId, accessType,
        totalQuota: totalQuota || null, remainingQuota: totalQuota || null,
        startDate: new Date(), endDate, status: 'active', createdBy: userId,
      } as any);
      return NextResponse.json({ data: access }, { status: 201 });
    }

    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Spécifiez un planId ou activityId + accessType' } },
      { status: 400 },
    );
  }

  return { GET, POST };
}

export function createClientAccessByIdHandler(config: Pick<ClientAccessHandlerConfig, 'checkAuth' | 'getClientAccessRepo'>) {
  const { checkAuth, getClientAccessRepo } = config;

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; accessId: string }> },
  ) {
    const { error } = await checkAuth('access:update');
    if (error) return error;

    const { accessId } = await params;
    const body = await req.json();
    const repo = await getClientAccessRepo();
    const access = await repo.update(accessId, body);
    if (!access) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Accès non trouvé' } }, { status: 404 });
    }
    return NextResponse.json({ data: access });
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; accessId: string }> },
  ) {
    const { error } = await checkAuth('access:revoke');
    if (error) return error;

    const { accessId } = await params;
    const repo = await getClientAccessRepo();
    const access = await repo.block(accessId);
    if (!access) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Accès non trouvé' } }, { status: 404 });
    }
    return NextResponse.json({ data: access });
  }

  return { PUT, DELETE };
}
