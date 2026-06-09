// @mostajs/secu — Lockers dashboard page (full version)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@mostajs/ui/button'
import { Input } from '@mostajs/ui/input'
import { Label } from '@mostajs/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@mostajs/ui/card'
import { Badge } from '@mostajs/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@mostajs/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@mostajs/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@mostajs/ui/select'
import {
  Loader2, Search, Plus, Wrench, WrenchIcon, CheckCircle2, XCircle,
  Trash2, Lock, Unlock, AlertTriangle, History, UserPlus, Nfc,
} from 'lucide-react'
import { toast } from 'sonner'
import { t } from '../lib/i18n.js'
import { cn } from '@mostajs/ui/lib/utils'

interface LockerClient {
  id: string
  clientNumber: string
  firstName: string
  lastName: string
}

interface Locker {
  id: string
  number: number
  zone: string
  status: string
  rfidLockId?: string | null
  currentClient?: LockerClient | null
  currentTag?: { tagId: string } | null
  lastAssignedAt?: string | null
  createdAt: string
}

interface LockerEvent {
  id: string
  eventType: string
  client?: { firstName: string; lastName: string; clientNumber: string } | null
  performedBy?: { firstName: string; lastName: string } | null
  notes?: string
  timestamp: string
}

type DialogMode = 'detail' | 'assign' | 'release' | 'loss' | 'maintenance' | 'create' | 'rfid_lock' | null

export default function LockersPage() {
  const queryClient = useQueryClient()
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [lossNotes, setLossNotes] = useState('')
  const [maintenanceNotes, setMaintenanceNotes] = useState('')
  const [rfidLockInput, setRfidLockInput] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Create form
  const [createForm, setCreateForm] = useState({ zone: 'A', count: '1', startNumber: '' })

  const { data: lockers, isLoading } = useQuery({
    queryKey: ['lockers'],
    queryFn: async () => {
      const res = await fetch('/api/lockers')
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data as Locker[]
    },
    refetchInterval: 10000,
  })

  const { data: searchResults } = useQuery({
    queryKey: ['clientSearch', clientSearch],
    queryFn: async () => {
      if (clientSearch.length < 2) return []
      const res = await fetch(`/api/clients/search?q=${clientSearch}`)
      if (!res.ok) return []
      return (await res.json()).data
    },
    enabled: clientSearch.length >= 2,
  })

  // Locker events for detail view
  const { data: lockerEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['lockerEvents', selectedLocker?.id],
    queryFn: async () => {
      const res = await fetch(`/api/lockers/events?lockerId=${selectedLocker!.id}&limit=20`)
      if (!res.ok) return []
      return (await res.json()).data as LockerEvent[]
    },
    enabled: !!selectedLocker && dialogMode === 'detail',
  })

  const assignMutation = useMutation({
    mutationFn: async ({ lockerId, clientId }: { lockerId: string; clientId: string }) => {
      const res = await fetch('/api/lockers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId, clientId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success('Casier attribué')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const releaseMutation = useMutation({
    mutationFn: async (lockerId: string) => {
      const res = await fetch('/api/lockers/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success('Casier libéré')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const lossMutation = useMutation({
    mutationFn: async ({ lockerId, notes }: { lockerId: string; notes: string }) => {
      const res = await fetch('/api/lockers/report-loss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId, notes }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success('Perte TAG signalée')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const maintenanceMutation = useMutation({
    mutationFn: async ({ lockerId, action, notes }: { lockerId: string; action: string; notes?: string }) => {
      const res = await fetch('/api/lockers/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId, action, notes }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success(vars.action === 'start' ? 'Casier en maintenance' : 'Maintenance terminée')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: async (data: { zone: string; count: number; startNumber: number }) => {
      const results = []
      for (let i = 0; i < data.count; i++) {
        const number = data.startNumber + i
        const res = await fetch('/api/lockers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number, zone: data.zone }),
        })
        if (!res.ok) {
          const err = await res.json()
          results.push({ number, error: err.error?.message || 'Erreur' })
        } else {
          results.push({ number, success: true })
        }
      }
      const errors = results.filter((r) => 'error' in r)
      if (errors.length > 0 && errors.length === results.length) {
        throw new Error(errors[0].error as string)
      }
      return { total: results.length, errors: errors.length }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      if (result.errors > 0) {
        toast.warning(`${result.total - result.errors} casier(s) créé(s), ${result.errors} erreur(s)`)
      } else {
        toast.success(`${result.total} casier(s) créé(s)`)
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (lockerId: string) => {
      const res = await fetch(`/api/lockers/${lockerId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success('Casier supprimé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rfidLockMutation = useMutation({
    mutationFn: async ({ lockerId, rfidLockId }: { lockerId: string; rfidLockId: string | null }) => {
      const res = await fetch(`/api/lockers/${lockerId}/rfid-lock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfidLockId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockers'] })
      closeDialog()
      toast.success('TAG Serrure RFID mis à jour')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function closeDialog() {
    setDialogMode(null)
    setSelectedLocker(null)
    setClientSearch('')
    setSelectedClientId('')
    setLossNotes('')
    setMaintenanceNotes('')
    setRfidLockInput('')
  }

  function openDetail(locker: Locker) {
    setSelectedLocker(locker)
    setDialogMode('detail')
  }

  function openCreate() {
    const maxNumber = lockers?.reduce((max, l) => Math.max(max, l.number), 0) || 0
    setCreateForm({ zone: 'A', count: '1', startNumber: String(maxNumber + 1) })
    setDialogMode('create')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    createMutation.mutate({
      zone: createForm.zone,
      count: Number(createForm.count),
      startNumber: Number(createForm.startNumber),
    })
  }

  const zones = ['A', 'B', 'C']
  const statusColors: Record<string, string> = {
    available: 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200',
    occupied: 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200',
    maintenance: 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200',
    out_of_order: 'bg-gray-200 border-gray-400 text-gray-600 hover:bg-gray-300',
  }
  const statusIcons: Record<string, React.ReactNode> = {
    available: <Unlock className="h-3 w-3" />,
    occupied: <Lock className="h-3 w-3" />,
    maintenance: <Wrench className="h-3 w-3" />,
    out_of_order: <XCircle className="h-3 w-3" />,
  }
  const statusLabels: Record<string, string> = {
    available: 'Disponible',
    occupied: 'Occupé',
    maintenance: 'Maintenance',
    out_of_order: 'Hors service',
  }
  const eventTypeLabels: Record<string, string> = {
    assigned: 'Attribution',
    released: 'Libération',
    tag_lost: 'Perte TAG',
    maintenance_start: 'Début maintenance',
    maintenance_end: 'Fin maintenance',
  }
  const eventTypeColors: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-800',
    released: 'bg-green-100 text-green-800',
    tag_lost: 'bg-red-100 text-red-800',
    maintenance_start: 'bg-yellow-100 text-yellow-800',
    maintenance_end: 'bg-emerald-100 text-emerald-800',
  }

  const stats = {
    total: lockers?.length || 0,
    available: lockers?.filter((l) => l.status === 'available').length || 0,
    occupied: lockers?.filter((l) => l.status === 'occupied').length || 0,
    maintenance: lockers?.filter((l) => l.status === 'maintenance').length || 0,
    out_of_order: lockers?.filter((l) => l.status === 'out_of_order').length || 0,
  }

  const filteredLockers = lockers?.filter((l) => filterStatus === 'all' || l.status === filterStatus)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t('lockers.title')}</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter des casiers
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tous', count: stats.total, cls: '' },
          { key: 'available', label: 'Disponibles', count: stats.available, cls: 'bg-green-50 border-green-200' },
          { key: 'occupied', label: 'Occupés', count: stats.occupied, cls: 'bg-red-50 border-red-200' },
          { key: 'maintenance', label: 'Maintenance', count: stats.maintenance, cls: 'bg-yellow-50 border-yellow-200' },
          { key: 'out_of_order', label: 'Hors service', count: stats.out_of_order, cls: 'bg-gray-100 border-gray-300' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer',
              s.cls || 'bg-white',
              filterStatus === s.key ? 'ring-2 ring-sky-400 font-semibold' : 'opacity-80 hover:opacity-100'
            )}
          >
            {s.label}: {s.count}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-200 border border-green-400" /> Disponible</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-200 border border-red-400" /> Occupé</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-yellow-200 border border-yellow-400" /> Maintenance</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-gray-300 border border-gray-400" /> Hors service</div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {zones.map((zone) => {
            const zoneLockers = filteredLockers?.filter((l) => l.zone === zone) || []
            const totalInZone = lockers?.filter((l) => l.zone === zone).length || 0
            if (totalInZone === 0) return null
            return (
              <Card key={zone}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{t(`lockers.zones.${zone}`)}</span>
                    <span className="text-sm font-normal text-gray-500">
                      {zoneLockers.length}{filterStatus !== 'all' ? ` / ${totalInZone}` : ''} casier(s)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {zoneLockers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun casier avec ce filtre</p>
                  ) : (
                    <div className="grid grid-cols-8 gap-2 md:grid-cols-10 lg:grid-cols-16">
                      {zoneLockers.map((locker) => (
                        <button
                          key={locker.id}
                          onClick={() => openDetail(locker)}
                          className={cn(
                            'relative flex flex-col h-14 w-14 items-center justify-center rounded-md border text-xs font-bold transition-colors cursor-pointer gap-0.5',
                            statusColors[locker.status]
                          )}
                          title={
                            locker.currentClient
                              ? `${locker.currentClient.firstName} ${locker.currentClient.lastName}`
                              : statusLabels[locker.status]
                          }
                        >
                          {statusIcons[locker.status]}
                          <span>{locker.number}</span>
                          <Nfc className={cn(
                            'absolute bottom-0.5 left-0.5 h-3 w-3',
                            locker.rfidLockId ? 'text-green-600 opacity-70' : 'text-red-500 opacity-50'
                          )} />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={dialogMode === 'detail'} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Casier N°{selectedLocker?.number}
              <Badge className={cn('ml-2', statusColors[selectedLocker?.status || ''])} variant="secondary">
                {statusLabels[selectedLocker?.status || '']}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Zone</span>
                <span className="font-medium">{selectedLocker?.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">TAG Serrure</span>
                {selectedLocker?.rfidLockId ? (
                  <span className="font-medium font-mono text-xs">{selectedLocker.rfidLockId}</span>
                ) : (
                  <span className="text-gray-400 italic">Non attribué</span>
                )}
              </div>
              {selectedLocker?.currentClient && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Client</span>
                  <span className="font-medium">
                    {selectedLocker.currentClient.firstName} {selectedLocker.currentClient.lastName}
                    <span className="text-gray-400 ml-1">({selectedLocker.currentClient.clientNumber})</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">TAG Client</span>
                {selectedLocker?.currentTag ? (
                  <span className="font-medium font-mono text-xs">{selectedLocker.currentTag.tagId}</span>
                ) : (
                  <span className="text-gray-400 italic">Aucun</span>
                )}
              </div>
              {selectedLocker?.lastAssignedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Attribué le</span>
                  <span className="font-medium">{new Date(selectedLocker.lastAssignedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {selectedLocker?.status === 'available' && (
                <>
                  <Button size="sm" onClick={() => { setClientSearch(''); setSelectedClientId(''); setDialogMode('assign') }}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Attribuer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setMaintenanceNotes(''); setDialogMode('maintenance') }}>
                    <Wrench className="mr-1.5 h-3.5 w-3.5" /> Maintenance
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                  </Button>
                </>
              )}
              {selectedLocker?.status === 'occupied' && (
                <>
                  <Button size="sm" onClick={() => setDialogMode('release')}>
                    <Unlock className="mr-1.5 h-3.5 w-3.5" /> Libérer
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => { setLossNotes(''); setDialogMode('loss') }}>
                    <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Perte TAG
                  </Button>
                </>
              )}
              {(selectedLocker?.status === 'maintenance' || selectedLocker?.status === 'out_of_order') && (
                <>
                  <Button size="sm" onClick={() => maintenanceMutation.mutate({ lockerId: selectedLocker.id, action: 'end' })} disabled={maintenanceMutation.isPending}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {maintenanceMutation.isPending ? 'En cours...' : 'Remettre disponible'}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(true)} disabled={deleteMutation.isPending}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => { setRfidLockInput(selectedLocker?.rfidLockId || ''); setDialogMode('rfid_lock') }}>
                <Nfc className="mr-1.5 h-3.5 w-3.5" /> TAG Serrure
              </Button>
            </div>

            {/* Event history */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <History className="h-3.5 w-3.5" /> Historique
              </h4>
              {eventsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
              ) : lockerEvents && lockerEvents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {lockerEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-2 text-xs">
                      <Badge className={cn('shrink-0 text-[10px]', eventTypeColors[event.eventType])} variant="secondary">
                        {eventTypeLabels[event.eventType] || event.eventType}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        {event.client && <span className="font-medium">{event.client.firstName} {event.client.lastName}</span>}
                        {event.notes && <span className="text-gray-500 ml-1">— {event.notes}</span>}
                        <div className="text-gray-400">
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                          {event.performedBy && ` • par ${event.performedBy.firstName} ${event.performedBy.lastName}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">Aucun événement</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={dialogMode === 'assign'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lockers.actions.assign')} — Casier N°{selectedLocker?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder={t('clients.search.placeholder')} value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10" />
            </div>
            {searchResults && searchResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {searchResults.map((c: any) => (
                  <button key={c.id} className={cn('w-full text-left px-3 py-2 text-sm hover:bg-gray-50', selectedClientId === c.id && 'bg-sky-50')} onClick={() => setSelectedClientId(c.id)}>
                    {c.firstName} {c.lastName} ({c.clientNumber})
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => assignMutation.mutate({ lockerId: selectedLocker!.id, clientId: selectedClientId })} disabled={!selectedClientId || assignMutation.isPending} className="w-full">
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('lockers.actions.assign')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release confirmation dialog */}
      <Dialog open={dialogMode === 'release'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Libérer casier N°{selectedLocker?.number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedLocker?.currentClient && (
              <p className="text-sm">Client: <strong>{selectedLocker.currentClient.firstName} {selectedLocker.currentClient.lastName}</strong> <span className="text-gray-400 ml-1">({selectedLocker.currentClient.clientNumber})</span></p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => releaseMutation.mutate(selectedLocker!.id)} disabled={releaseMutation.isPending} className="flex-1">
                {releaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmer la libération
              </Button>
              <Button variant="outline" onClick={() => closeDialog()}>Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loss dialog */}
      <Dialog open={dialogMode === 'loss'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('lockers.actions.reportLoss')} — Casier N°{selectedLocker?.number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={lossNotes} onChange={(e) => setLossNotes(e.target.value)} placeholder="Détails de la perte..." />
            </div>
            <Button variant="destructive" onClick={() => lossMutation.mutate({ lockerId: selectedLocker!.id, notes: lossNotes })} disabled={lossMutation.isPending} className="w-full">
              {lossMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirmer perte TAG
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance dialog */}
      <Dialog open={dialogMode === 'maintenance'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Maintenance — Casier N°{selectedLocker?.number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Input value={maintenanceNotes} onChange={(e) => setMaintenanceNotes(e.target.value)} placeholder="Raison de la maintenance..." />
            </div>
            <Button onClick={() => maintenanceMutation.mutate({ lockerId: selectedLocker!.id, action: 'start', notes: maintenanceNotes || undefined })} disabled={maintenanceMutation.isPending} className="w-full">
              {maintenanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <WrenchIcon className="mr-2 h-4 w-4" /> Mettre en maintenance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogMode === 'create'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter des casiers</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select value={createForm.zone} onValueChange={(v) => setCreateForm({ ...createForm, zone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Zone A</SelectItem>
                    <SelectItem value="B">Zone B</SelectItem>
                    <SelectItem value="C">Zone C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input type="number" min={1} max={50} value={createForm.count} onChange={(e) => setCreateForm({ ...createForm, count: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Numéro de départ</Label>
              <Input type="number" min={1} value={createForm.startNumber} onChange={(e) => setCreateForm({ ...createForm, startNumber: e.target.value })} required />
              {Number(createForm.count) > 1 && Number(createForm.startNumber) > 0 && (
                <p className="text-xs text-gray-500">Numéros: {createForm.startNumber} à {Number(createForm.startNumber) + Number(createForm.count) - 1}</p>
              )}
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer {createForm.count} casier(s)
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* RFID Lock dialog */}
      <Dialog open={dialogMode === 'rfid_lock'} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Nfc className="h-5 w-5" /> TAG Serrure RFID — Casier N°{selectedLocker?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID du TAG RFID de la serrure</Label>
              <Input value={rfidLockInput} onChange={(e) => setRfidLockInput(e.target.value)} placeholder="Scanner ou saisir l'ID du TAG..." autoFocus />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => rfidLockMutation.mutate({ lockerId: selectedLocker!.id, rfidLockId: rfidLockInput.trim() || null })} disabled={rfidLockMutation.isPending || !rfidLockInput.trim()} className="flex-1">
                {rfidLockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedLocker?.rfidLockId ? 'Modifier' : 'Attribuer'}
              </Button>
              {selectedLocker?.rfidLockId && (
                <Button variant="destructive" onClick={() => rfidLockMutation.mutate({ lockerId: selectedLocker!.id, rfidLockId: null })} disabled={rfidLockMutation.isPending}>
                  {rfidLockMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Retirer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>Supprimer le casier N°{selectedLocker?.number} définitivement ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(selectedLocker!.id); setConfirmDelete(false) }}>
              {t('common.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
