// @mostajs/secu — Client detail page
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@mostajs/ui/button'
import { Badge } from '@mostajs/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@mostajs/ui/card'
import { Separator } from '@mostajs/ui/separator'
import { Pencil, ArrowLeft, Loader2, ShieldCheck, ShieldAlert, ScanFace, Nfc, Lock, Printer } from 'lucide-react'
import { t } from '../lib/i18n.js'
import { useSettings } from '@mostajs/settings/hooks/useSettings'
import AccessGrid from '../components/AccessGrid.js'
import ClientCardGenerator from '../components/ClientCardGenerator.js'
import FaceDetector from '@mostajs/ticketing/components/FaceDetector'

export default function ClientDetailPage({ params }: { params?: Record<string, string> }) {
  const id = params?.id
  const router = useRouter()
  const { settings } = useSettings()
  const [showFaceVerify, setShowFaceVerify] = useState(false)
  const [faceVerifyResult, setFaceVerifyResult] = useState<{ match: boolean; distance: number } | null>(null)

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const { data: accessData } = useQuery({
    queryKey: ['client-access', id],
    queryFn: async () => {
      const [accRes, actRes] = await Promise.all([
        fetch(`/api/clients/${id}/access`),
        fetch('/api/activities'),
      ])
      const accesses = accRes.ok ? (await accRes.json()).data || [] : []
      const activities = actRes.ok ? (await actRes.json()).data || [] : []
      return { accesses, activities }
    },
    enabled: !!id,
  })

  const client = clientData?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!client) return <div>Client non trouvé</div>

  const typeColors: Record<string, string> = {
    abonne: 'bg-blue-100 text-blue-800',
    visiteur: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {client.firstName} {client.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500 font-mono">{client.clientNumber}</span>
              <Badge className={typeColors[client.clientType] || ''} variant="secondary">
                {t(`clients.types.${client.clientType}`)}
              </Badge>
            </div>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/clients/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('common.actions.edit')}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('clients.fields.phone')}</span>
                  <p className="font-medium">{client.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('clients.fields.email')}</span>
                  <p className="font-medium">{client.email || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('clients.fields.dateOfBirth')}</span>
                  <p className="font-medium">
                    {client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">{t('clients.fields.gender')}</span>
                  <p className="font-medium">{client.gender === 'male' ? 'Homme' : client.gender === 'female' ? 'Femme' : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('clients.fields.address')}</span>
                  <p className="font-medium">{client.address || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">{t('clients.fields.wilaya')}</span>
                  <p className="font-medium">{client.wilaya || '-'}</p>
                </div>
              </div>
              {client.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-gray-500">{t('clients.fields.notes')}</span>
                    <p className="text-sm">{client.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <AccessGrid
            clientId={id as string}
            accesses={accessData?.accesses || []}
            activities={accessData?.activities || []}
            t={t}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              {client.photo ? (
                <img src={client.photo} alt="Photo" className="mx-auto h-40 w-40 rounded-full object-cover" />
              ) : (
                <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-gray-500">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
              )}

              {settings.faceRecognitionEnabled && (
                <div className="flex justify-center">
                  {client.faceDescriptor?.length === 128 ? (
                    <Badge className="bg-green-100 text-green-700" variant="secondary">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Visage enregistré
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500" variant="secondary">
                      <ShieldAlert className="mr-1 h-3 w-3" />
                      Pas de données faciales
                    </Badge>
                  )}
                </div>
              )}

              {settings.faceRecognitionEnabled && client.faceDescriptor?.length === 128 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowFaceVerify(!showFaceVerify); setFaceVerifyResult(null) }}
                  className="w-full"
                >
                  <ScanFace className="mr-2 h-4 w-4" />
                  {showFaceVerify ? 'Fermer vérification' : 'Vérifier visage'}
                </Button>
              )}

              {showFaceVerify && client.faceDescriptor?.length === 128 && (
                <div className="text-left">
                  <FaceDetector
                    photo=""
                    onCapture={() => {}}
                    onClear={() => {}}
                    verifyDescriptor={client.faceDescriptor}
                    onVerifyResult={setFaceVerifyResult}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {client.clientType === 'abonne' && (
            <ClientCardGenerator client={client} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Nfc className="h-4 w-4" />
                TAG RFID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.rfidTagId && typeof client.rfidTagId === 'object' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ID TAG</span>
                    <span className="font-mono font-medium">{client.rfidTagId.tagId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <Badge
                      variant="secondary"
                      className={
                        client.rfidTagId.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : client.rfidTagId.status === 'lost'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {client.rfidTagId.status === 'active' ? 'Actif' : client.rfidTagId.status === 'lost' ? 'Perdu' : client.rfidTagId.status === 'deactivated' ? 'Désactivé' : client.rfidTagId.status}
                    </Badge>
                  </div>
                  {client.rfidTagId.assignedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attribué le</span>
                      <span className="font-medium">{new Date(client.rfidTagId.assignedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Aucun TAG attribué</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Casier
              </CardTitle>
              {client.locker && (
                <button
                  onClick={() => {
                    const w = window.open('', '_blank', 'width=300,height=400')
                    if (!w) return
                    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Casier</title><style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: monospace; width: 72mm; padding: 4mm; font-size: 12px; }
                      h2 { text-align: center; font-size: 16px; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 6px; }
                      .row { display: flex; justify-content: space-between; padding: 3px 0; }
                      .label { color: #555; }
                      .val { font-weight: bold; }
                      .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 6px; font-size: 10px; color: #888; }
                    </style></head><body>
                      <h2>CASIER</h2>
                      <div class="row"><span class="label">Casier</span><span class="val">N\u00b0${client.locker.number}</span></div>
                      <div class="row"><span class="label">Zone</span><span class="val">${client.locker.zone}</span></div>
                      <div class="row"><span class="label">TAG Serrure</span><span class="val">${client.locker.rfidLockId || 'Non attribu\u00e9'}</span></div>
                      <div class="row"><span class="label">Client</span><span class="val">${client.firstName} ${client.lastName}</span></div>
                      <div class="row"><span class="label">N\u00b0 Client</span><span class="val">${client.clientNumber}</span></div>
                      ${client.locker.lastAssignedAt ? `<div class="row"><span class="label">Attribu\u00e9 le</span><span class="val">${new Date(client.locker.lastAssignedAt).toLocaleDateString('fr-FR')}</span></div>` : ''}
                      <div class="footer">${new Date().toLocaleString('fr-FR')}</div>
                    </body></html>`)
                    w.document.close()
                    w.onafterprint = () => w.close()
                    setTimeout(() => w.print(), 250)
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="Imprimer"
                >
                  <Printer className="h-4 w-4" />
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.locker ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Casier</span>
                    <span className="font-medium">N°{client.locker.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Zone</span>
                    <span className="font-medium">{client.locker.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TAG Serrure</span>
                    {client.locker.rfidLockId ? (
                      <span className="font-mono font-medium text-xs">{client.locker.rfidLockId}</span>
                    ) : (
                      <span className="text-gray-400 italic">Non attribué</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="font-medium">
                      {client.firstName} {client.lastName}
                      <span className="text-gray-400 ml-1">({client.clientNumber})</span>
                    </span>
                  </div>
                  {client.locker.lastAssignedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attribué le</span>
                      <span className="font-medium">{new Date(client.locker.lastAssignedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-400">Aucun casier attribué</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
