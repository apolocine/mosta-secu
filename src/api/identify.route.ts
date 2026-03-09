// @mostajs/secu — Identify handler factory (QR code → client or ticket)
// Author: Dr Hamid MADANI drmdh@msn.com
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SecuAuthResult } from '../types/index.js';
import type { ClientRepository } from '../repositories/client.repository.js';

export interface IdentifyHandlerConfig {
  checkAuth: (permission: string) => Promise<SecuAuthResult>;
  getClientRepo: () => Promise<ClientRepository>;
  /** Optional: ticket repo to also check if QR is a ticket code */
  getTicketRepo?: () => Promise<{ findByCode: (code: string) => Promise<any> }>;
}

export function createIdentifyHandler(config: IdentifyHandlerConfig) {
  const { checkAuth, getClientRepo, getTicketRepo } = config;

  async function POST(req: NextRequest) {
    const { error } = await checkAuth('client:search');
    if (error) return error;

    const body = await req.json();
    const qrCode = body?.qrCode;

    if (!qrCode || typeof qrCode !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'QR code requis' } },
        { status: 400 },
      );
    }

    const cRepo = await getClientRepo();
    const client = await cRepo.findByQrCode(qrCode);

    if (client) {
      return NextResponse.json({ data: { type: 'client', client } });
    }

    if (getTicketRepo) {
      const tRepo = await getTicketRepo();
      const ticket = await tRepo.findByCode(qrCode);
      if (ticket) {
        return NextResponse.json({ data: { type: 'ticket', ticket } });
      }
    }

    return NextResponse.json({ data: { type: 'unknown' } });
  }

  return { POST };
}
