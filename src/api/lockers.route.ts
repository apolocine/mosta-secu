// @mostajs/secu — Lockers handler factory (list, create, assign, release, maintenance, report-loss, events)
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { LockerRepository } from '../repositories/locker.repository.js';
import type { LockerEventRepository } from '../repositories/locker-event.repository.js';
import type { RfidTagRepository } from '../repositories/rfid-tag.repository.js';
import type { ClientRepository } from '../repositories/client.repository.js';

export interface LockersHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getLockerRepo: () => Promise<LockerRepository>;
  getLockerEventRepo: () => Promise<LockerEventRepository>;
  getRfidTagRepo: () => Promise<RfidTagRepository>;
  getClientRepo: () => Promise<ClientRepository>;
  logAudit?: (entry: Record<string, unknown>) => Promise<void>;
  getAuditUser?: (session: any) => Record<string, unknown>;
}

export function createLockersHandler(config: LockersHandlerConfig) {
  const { checkAuth, getLockerRepo, getLockerEventRepo } = config;

  async function GET() {
    const { error } = await checkAuth('locker:view');
    if (error) return error;

    const repo = await getLockerRepo();
    const lockers = await repo.findAllWithOccupants();
    return NextResponse.json({ data: lockers });
  }

  async function POST(req: NextRequest) {
    const { error } = await checkAuth('locker:manage');
    if (error) return error;

    const { number, zone, rfidLockId } = await req.json();
    const repo = await getLockerRepo();
    const existing = await repo.findOne({ number });
    if (existing) {
      return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce numero existe deja' } }, { status: 409 });
    }

    const locker = await repo.create({ number, zone, rfidLockId } as any);
    return NextResponse.json({ data: locker }, { status: 201 });
  }

  return { GET, POST };
}

export function createLockerAssignHandler(config: LockersHandlerConfig) {
  const { checkAuth, getLockerRepo, getLockerEventRepo, getRfidTagRepo, getClientRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('locker:assign');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const { lockerId, clientId, tagId } = await req.json();

    const lRepo = await getLockerRepo();
    const locker = await lRepo.findById(lockerId);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }
    if (locker.status !== 'available') {
      return NextResponse.json({ error: { code: 'INVALID', message: 'Casier non disponible' } }, { status: 400 });
    }

    const cRepo = await getClientRepo();
    const client = await cRepo.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Client non trouve' } }, { status: 404 });
    }

    let rfidTagId = null;
    if (tagId) {
      const tRepo = await getRfidTagRepo();
      const tag = await tRepo.findById(tagId);
      rfidTagId = tag?.id || null;
    }

    const updated = await lRepo.assign(lockerId, clientId, rfidTagId);

    const leRepo = await getLockerEventRepo();
    await leRepo.create({
      locker: lockerId, client: clientId, rfidTag: rfidTagId,
      eventType: 'assigned', performedBy: userId,
    } as any);

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session),
        action: 'locker_assign', module: 'lockers',
        resource: `Casier ${locker.zone}-${locker.number}`, resourceId: locker.id,
        details: { clientId, clientName: `${client.firstName} ${client.lastName}` },
      });
    }

    return NextResponse.json({ data: updated });
  }

  return { POST };
}

export function createLockerReleaseHandler(config: LockersHandlerConfig) {
  const { checkAuth, getLockerRepo, getLockerEventRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('locker:release');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const { lockerId } = await req.json();

    const lRepo = await getLockerRepo();
    const locker = await lRepo.findById(lockerId);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }
    if (locker.status !== 'occupied') {
      return NextResponse.json({ error: { code: 'INVALID', message: 'Casier non occupe' } }, { status: 400 });
    }

    const previousClient = locker.currentClient;
    const previousTag = locker.currentTag;
    const updated = await lRepo.release(lockerId);

    const leRepo = await getLockerEventRepo();
    await leRepo.create({
      locker: lockerId, client: previousClient, rfidTag: previousTag,
      eventType: 'released', performedBy: userId,
    } as any);

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session),
        action: 'locker_release', module: 'lockers',
        resource: `Casier ${locker.zone}-${locker.number}`, resourceId: locker.id,
      });
    }

    return NextResponse.json({ data: updated });
  }

  return { POST };
}

export function createLockerMaintenanceHandler(config: LockersHandlerConfig) {
  const { checkAuth, getLockerRepo, getLockerEventRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('locker:manage');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const { lockerId, action, notes } = await req.json();

    const lRepo = await getLockerRepo();
    const locker = await lRepo.findById(lockerId);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }

    const leRepo = await getLockerEventRepo();

    if (action === 'start') {
      if (locker.status === 'occupied') {
        return NextResponse.json({ error: { code: 'INVALID', message: 'Liberez le casier avant la maintenance' } }, { status: 400 });
      }
      if (locker.status === 'maintenance') {
        return NextResponse.json({ error: { code: 'INVALID', message: 'Casier deja en maintenance' } }, { status: 400 });
      }
      await lRepo.setMaintenance(lockerId);
      await leRepo.create({ locker: lockerId, eventType: 'maintenance_start', performedBy: userId, notes } as any);

      if (logAudit && getAuditUser) {
        await logAudit({ ...getAuditUser(session), action: 'locker_maintenance_start', module: 'lockers', resource: `Casier ${locker.zone}-${locker.number}`, resourceId: locker.id, details: { notes } });
      }
    } else if (action === 'end') {
      if (locker.status !== 'maintenance' && locker.status !== 'out_of_order') {
        return NextResponse.json({ error: { code: 'INVALID', message: 'Casier pas en maintenance' } }, { status: 400 });
      }
      await lRepo.endMaintenance(lockerId);
      await leRepo.create({ locker: lockerId, eventType: 'maintenance_end', performedBy: userId, notes } as any);

      if (logAudit && getAuditUser) {
        await logAudit({ ...getAuditUser(session), action: 'locker_maintenance_end', module: 'lockers', resource: `Casier ${locker.zone}-${locker.number}`, resourceId: locker.id, details: { notes } });
      }
    } else {
      return NextResponse.json({ error: { code: 'INVALID', message: 'Action invalide (start ou end)' } }, { status: 400 });
    }

    const updated = await lRepo.findById(lockerId);
    return NextResponse.json({ data: updated });
  }

  return { POST };
}

export function createLockerReportLossHandler(config: LockersHandlerConfig) {
  const { checkAuth, getLockerRepo, getLockerEventRepo, getRfidTagRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('locker:manage');
    if (error) return error;

    const userId = session?.user?.id || req.headers.get('x-auth-user-id') || '';
    const { lockerId, notes } = await req.json();

    const lRepo = await getLockerRepo();
    const locker = await lRepo.findById(lockerId);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }

    if (locker.currentTag) {
      const tRepo = await getRfidTagRepo();
      const tagId = typeof locker.currentTag === 'object' ? locker.currentTag.id : locker.currentTag;
      await tRepo.markLost(tagId);
    }

    const leRepo = await getLockerEventRepo();
    await leRepo.create({
      locker: lockerId, client: locker.currentClient, rfidTag: locker.currentTag,
      eventType: 'tag_lost', performedBy: userId, notes,
    } as any);

    const updated = await lRepo.release(lockerId);

    if (logAudit && getAuditUser) {
      await logAudit({ ...getAuditUser(session), action: 'tag_lost', module: 'lockers', resource: `Casier ${locker.zone}-${locker.number}`, resourceId: locker.id, details: { notes } });
    }

    return NextResponse.json({ data: updated });
  }

  return { POST };
}

export function createLockerEventsHandler(config: Pick<LockersHandlerConfig, 'checkAuth' | 'getLockerEventRepo'>) {
  const { checkAuth, getLockerEventRepo } = config;

  async function GET(req: NextRequest) {
    const { error } = await checkAuth('locker:view');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const lockerId = searchParams.get('lockerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const repo = await getLockerEventRepo();
    const filter: any = {};
    if (lockerId) filter.locker = lockerId;

    const events = await repo.findWithRelations(
      filter, ['client', 'performedBy'], { sort: { timestamp: -1 }, limit },
    );

    return NextResponse.json({ data: events });
  }

  return { GET };
}

export function createLockerByIdHandler(config: Pick<LockersHandlerConfig, 'checkAuth' | 'getLockerRepo'>) {
  const { checkAuth, getLockerRepo } = config;

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('locker:manage');
    if (error) return error;

    const { id } = await params;
    const repo = await getLockerRepo();
    const locker = await repo.findById(id);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }
    if (locker.status === 'occupied') {
      return NextResponse.json({ error: { code: 'INVALID', message: 'Casier occupe, liberez-le d\'abord' } }, { status: 400 });
    }

    await repo.delete(id);
    return NextResponse.json({ data: { id } });
  }

  return { DELETE };
}

export function createLockerRfidLockHandler(config: Pick<LockersHandlerConfig, 'checkAuth' | 'getLockerRepo'>) {
  const { checkAuth, getLockerRepo } = config;

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('locker:manage');
    if (error) return error;

    const { id } = await params;
    const { rfidLockId } = await req.json();

    const repo = await getLockerRepo();
    const locker = await repo.findById(id);
    if (!locker) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Casier non trouve' } }, { status: 404 });
    }

    const updated = await repo.update(id, { rfidLockId: rfidLockId || null });
    return NextResponse.json({ data: updated });
  }

  return { PUT };
}
