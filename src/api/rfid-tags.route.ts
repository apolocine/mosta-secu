// @mostajs/secu — RFID Tags handler factories
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { RfidTagRepository } from '../repositories/rfid-tag.repository.js';
import type { ClientRepository } from '../repositories/client.repository.js';

export interface RfidTagsHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getRfidTagRepo: () => Promise<RfidTagRepository>;
  getClientRepo: () => Promise<ClientRepository>;
  logAudit?: (entry: Record<string, unknown>) => Promise<void>;
  getAuditUser?: (session: any) => Record<string, unknown>;
}

export function createRfidTagsHandler(config: RfidTagsHandlerConfig) {
  const { checkAuth, getRfidTagRepo } = config;

  async function GET() {
    const { error } = await checkAuth('rfid:view');
    if (error) return error;
    const repo = await getRfidTagRepo();
    const tags = await repo.findAllWithRelations();
    return NextResponse.json({ data: tags });
  }

  async function POST(req: NextRequest) {
    const { error } = await checkAuth('rfid:program');
    if (error) return error;

    const { tagId, notes } = await req.json();
    if (!tagId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'tagId requis' } }, { status: 400 });
    }

    const repo = await getRfidTagRepo();
    const existing = await repo.findByTagId(tagId);
    if (existing) {
      return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce TAG existe deja' } }, { status: 409 });
    }

    const tag = await repo.create({ tagId, notes, status: 'available' } as any);
    return NextResponse.json({ data: tag }, { status: 201 });
  }

  return { GET, POST };
}

export function createRfidAssignHandler(config: RfidTagsHandlerConfig) {
  const { checkAuth, getRfidTagRepo, getClientRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('rfid:program');
    if (error) return error;

    const { tagId, clientId } = await req.json();

    const tRepo = await getRfidTagRepo();
    const tag = await tRepo.findByTagId(tagId);
    if (!tag) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'TAG non trouve' } }, { status: 404 });
    }
    if (tag.status !== 'available') {
      return NextResponse.json({ error: { code: 'INVALID', message: 'TAG non disponible' } }, { status: 400 });
    }

    const cRepo = await getClientRepo();
    const client = await cRepo.findById(clientId);
    if (!client) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Client non trouve' } }, { status: 404 });
    }

    const existingTag = await tRepo.findByClient(clientId);
    if (existingTag) {
      return NextResponse.json({ error: { code: 'DUPLICATE', message: 'Ce client a deja un TAG actif' } }, { status: 409 });
    }

    const updatedTag = await tRepo.assign(tag.id, clientId, session?.user?.id);
    await cRepo.update(clientId, { rfidTagId: tag.id } as any);

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session), action: 'tag_assign', module: 'rfid',
        resource: tagId, resourceId: tag.id,
        details: { clientId, clientName: `${client.firstName} ${client.lastName}` },
      });
    }

    return NextResponse.json({ data: updatedTag });
  }

  return { POST };
}

export function createRfidDeactivateHandler(config: RfidTagsHandlerConfig) {
  const { checkAuth, getRfidTagRepo, getClientRepo, logAudit, getAuditUser } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('rfid:deactivate');
    if (error) return error;

    const { tagId } = await req.json();
    const tRepo = await getRfidTagRepo();
    const tag = await tRepo.findByTagId(tagId);
    if (!tag) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'TAG non trouve' } }, { status: 404 });
    }

    if (tag.client) {
      const cRepo = await getClientRepo();
      await cRepo.update(typeof tag.client === 'object' ? tag.client.id : tag.client, { rfidTagId: null } as any);
    }

    const updated = await tRepo.deactivate(tag.id);

    if (logAudit && getAuditUser) {
      await logAudit({ ...getAuditUser(session), action: 'tag_deactivate', module: 'rfid', resource: tagId, resourceId: tag.id });
    }

    return NextResponse.json({ data: updated });
  }

  return { POST };
}

export function createRfidReplaceHandler(config: RfidTagsHandlerConfig) {
  const { checkAuth, getRfidTagRepo, getClientRepo } = config;

  async function POST(req: NextRequest) {
    const { error, session } = await checkAuth('rfid:replace');
    if (error) return error;

    const { oldTagId, newTagId } = await req.json();
    const tRepo = await getRfidTagRepo();

    const oldTag = await tRepo.findByTagId(oldTagId);
    if (!oldTag) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Ancien TAG non trouve' } }, { status: 404 });
    }

    const newTag = await tRepo.findByTagId(newTagId);
    if (!newTag) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Nouveau TAG non trouve' } }, { status: 404 });
    }
    if (newTag.status !== 'available') {
      return NextResponse.json({ error: { code: 'INVALID', message: 'Nouveau TAG non disponible' } }, { status: 400 });
    }

    const clientId = typeof oldTag.client === 'object' ? (oldTag.client as any)?.id : oldTag.client;

    const updatedOld = await tRepo.markLost(oldTag.id);
    const updatedNew = await tRepo.assign(newTag.id, clientId, session?.user?.id);

    if (clientId) {
      const cRepo = await getClientRepo();
      await cRepo.update(clientId, { rfidTagId: newTag.id } as any);
    }

    return NextResponse.json({ data: { oldTag: updatedOld, newTag: updatedNew } });
  }

  return { POST };
}
