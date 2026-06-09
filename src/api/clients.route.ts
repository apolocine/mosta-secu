// @mostajs/secu — Clients list & create handler factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ClientRepository } from '../repositories/client.repository.js';

export interface ClientsHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getClientRepo: () => Promise<ClientRepository>;
  logAudit?: (entry: Record<string, unknown>) => Promise<void>;
  getAuditUser?: (session: any) => Record<string, unknown>;
}

export function createClientsHandler(config: ClientsHandlerConfig) {
  const { checkAuth, getClientRepo, logAudit, getAuditUser } = config;

  async function GET(req: NextRequest) {
    const { error } = await checkAuth('client:view');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter: any = {};
    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $regexFlags: 'i' } },
        { lastName: { $regex: q, $regexFlags: 'i' } },
        { phone: { $regex: q, $regexFlags: 'i' } },
        { clientNumber: { $regex: q, $regexFlags: 'i' } },
        { email: { $regex: q, $regexFlags: 'i' } },
      ];
    }
    if (type) filter.clientType = type;
    if (status) filter.status = status;

    const repo = await getClientRepo();
    const [clients, total] = await Promise.all([
      repo.findAll(filter, { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit }),
      repo.count(filter),
    ]);

    return NextResponse.json({
      data: clients,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  }

  async function POST(req: NextRequest) {
    const { error, userId, session } = await checkAuth('client:create');
    if (error) return error;

    const body = await req.json();

    // Validation minimale
    if (!body.clientType || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'clientType, firstName, lastName requis' } },
        { status: 400 },
      );
    }

    const resolvedUserId = userId || req.headers.get('x-auth-user-id') || '';
    const clientData: any = { ...body, createdBy: resolvedUserId };
    if (clientData.email === '') delete clientData.email;
    if (clientData.dateOfBirth) clientData.dateOfBirth = new Date(clientData.dateOfBirth);

    const repo = await getClientRepo();
    const client = await repo.createWithAutoFields(clientData);

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session),
        action: 'client_create',
        module: 'clients',
        resource: `${client.firstName} ${client.lastName}`,
        resourceId: client.id,
        details: { clientType: client.clientType, clientNumber: client.clientNumber },
      });
    }

    return NextResponse.json({ data: client }, { status: 201 });
  }

  return { GET, POST };
}
