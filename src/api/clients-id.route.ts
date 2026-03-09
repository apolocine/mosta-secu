// @mostajs/secu — Client by ID handler factory (GET, PUT, DELETE)
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ClientRepository } from '../repositories/client.repository.js';
import type { LockerRepository } from '../repositories/locker.repository.js';

export interface ClientByIdHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getClientRepo: () => Promise<ClientRepository>;
  getLockerRepo?: () => Promise<LockerRepository>;
  logAudit?: (entry: Record<string, unknown>) => Promise<void>;
  getAuditUser?: (session: any) => Record<string, unknown>;
}

export function createClientByIdHandler(config: ClientByIdHandlerConfig) {
  const { checkAuth, getClientRepo, getLockerRepo, logAudit, getAuditUser } = config;

  async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error } = await checkAuth('client:view');
    if (error) return error;

    const { id } = await params;
    const cRepo = await getClientRepo();
    const client = await cRepo.findByIdWithRfid(id);

    if (!client) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Client non trouve' } },
        { status: 404 },
      );
    }

    let locker = null;
    if (getLockerRepo) {
      const lRepo = await getLockerRepo();
      locker = await lRepo.findOne(
        { currentClient: id, status: 'occupied' },
        { select: ['number', 'zone', 'rfidLockId', 'lastAssignedAt'] },
      );
    }

    return NextResponse.json({ data: { ...client, locker: locker || null } });
  }

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error, session } = await checkAuth('client:update');
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const updateData: any = { ...body };
    if (updateData.email === '') delete updateData.email;
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);

    const repo = await getClientRepo();
    const client = await repo.update(id, updateData);

    if (!client) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Client non trouve' } },
        { status: 404 },
      );
    }

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session),
        action: 'client_update',
        module: 'clients',
        resource: `${client.firstName} ${client.lastName}`,
        resourceId: id,
      });
    }

    return NextResponse.json({ data: client });
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) {
    const { error, session } = await checkAuth('client:delete');
    if (error) return error;

    const { id } = await params;
    const repo = await getClientRepo();
    const client = await repo.update(id, { status: 'inactive' } as any);

    if (!client) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Client non trouve' } },
        { status: 404 },
      );
    }

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session),
        action: 'client_delete',
        module: 'clients',
        resource: `${client.firstName} ${client.lastName}`,
        resourceId: id,
      });
    }

    return NextResponse.json({ data: client });
  }

  return { GET, PUT, DELETE };
}
