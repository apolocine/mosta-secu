// @mostajs/secu — Client search handler factory
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ClientRepository } from '../repositories/client.repository.js';

export interface ClientSearchHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getClientRepo: () => Promise<ClientRepository>;
}

export function createClientSearchHandler(config: ClientSearchHandlerConfig) {
  const { checkAuth, getClientRepo } = config;

  async function GET(req: NextRequest) {
    const { error } = await checkAuth('client:search');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const repo = await getClientRepo();
    const clients = await repo.findAll(
      {
        $or: [
          { firstName: { $regex: q, $regexFlags: 'i' } },
          { lastName: { $regex: q, $regexFlags: 'i' } },
          { phone: { $regex: q, $regexFlags: 'i' } },
          { clientNumber: { $regex: q, $regexFlags: 'i' } },
        ],
        status: 'active',
      },
      {
        select: ['clientNumber', 'firstName', 'lastName', 'phone', 'clientType', 'photo'],
        limit: 10,
      },
    );

    return NextResponse.json({ data: clients });
  }

  return { GET };
}
