// @mostajs/secu — Activities handler factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ActivityRepository } from '../repositories/activity.repository.js';

export interface ActivitiesHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getActivityRepo: () => Promise<ActivityRepository>;
}

export function createActivitiesHandler(config: ActivitiesHandlerConfig) {
  const { checkAuth, getActivityRepo } = config;

  async function GET() {
    const { error } = await checkAuth('activity:view');
    if (error) return error;

    const repo = await getActivityRepo();
    const activities = await repo.findAllOrdered();
    return NextResponse.json({ data: activities });
  }

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('activity:create');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const body = await req.json();

    if (!body.name || !body.slug || body.price === undefined) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'name, slug et price requis' } },
        { status: 400 },
      );
    }

    const repo = await getActivityRepo();
    const existing = await repo.findBySlug(body.slug);
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Ce slug est déjà utilisé' } },
        { status: 409 },
      );
    }

    const activity = await repo.create({ ...body, createdBy: userId } as any);
    return NextResponse.json({ data: activity }, { status: 201 });
  }

  return { GET, POST };
}

export function createActivityByIdHandler(config: ActivitiesHandlerConfig) {
  const { checkAuth, getActivityRepo } = config;

  async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('activity:view');
    if (error) return error;

    const { id } = await params;
    const repo = await getActivityRepo();
    const activity = await repo.findById(id);
    if (!activity) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } }, { status: 404 });
    }
    return NextResponse.json({ data: activity });
  }

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('activity:update');
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const repo = await getActivityRepo();
    const activity = await repo.update(id, body);
    if (!activity) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } }, { status: 404 });
    }
    return NextResponse.json({ data: activity });
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('activity:delete');
    if (error) return error;

    const { id } = await params;
    const repo = await getActivityRepo();
    const deleted = await repo.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Activité non trouvée' } }, { status: 404 });
    }
    return NextResponse.json({ data: { message: 'Activité supprimée' } });
  }

  return { GET, PUT, DELETE };
}
