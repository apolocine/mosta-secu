// @mostajs/secu — RFID tags dashboard page (full version)
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@mostajs/ui/button'
import { Input } from '@mostajs/ui/input'
import { Label } from '@mostajs/ui/label'
import { Badge } from '@mostajs/ui/badge'
import { Card, CardContent } from '@mostajs/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@mostajs/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@mostajs/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@mostajs/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@mostajs/ui/table'
import { Plus, Loader2, XCircle, RefreshCw, UserPlus, Search, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '../lib/i18n.js'

interface RfidTag {
  id: string
  tagId: string
  client?: { id: string; clientNumber: string; firstName: string; lastName: string } | null
  status: 'available' | 'active' | 'deactivated' | 'lost'
  assignedAt?: string | null
  assignedBy?: { firstName: string; lastName: string } | null
  notes?: string
}

interface ClientResult {
  id: string
  clientNumber: string
  firstName: string
  lastName: string
  phone?: string
}

export default function RfidPage() {
  const queryClient = useQueryClient()

  // Dialog states
  const [programDialogOpen, setProgramDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [confirmReactivateId, setConfirmReactivateId] = useState<string | null>(null)
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null)

  // Form states
  const [newTagId, setNewTagId] = useState('')
  const [assignTag, setAssignTag] = useState<RfidTag | null>(null)
  const [replaceTag, setReplaceTag] = useState<RfidTag | null>(null)
  const [replaceNewTagId, setReplaceNewTagId] = useState('')

  // Client search
  const [clientSearch, setClientSearch] = useState('')
  const [clientResults, setClientResults] = useState<ClientResult[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(null)
  const [searching, setSearching] = useState(false)

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: tags, isLoading } = useQuery({
    queryKey: ['rfidTags'],
    queryFn: async () => {
      const res = await fetch('/api/rfid')
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data as RfidTag[]
    },
  })

  // --- Mutations ---

  const createMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch('/api/rfid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfidTags'] })
      setNewTagId('')
      setProgramDialogOpen(false)
      toast.success('TAG enregistré')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const assignMutation = useMutation({
    mutationFn: async ({ tagId, clientId }: { tagId: string; clientId: string }) => {
      const res = await fetch('/api/rfid/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, clientId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfidTags'] })
      closeAssignDialog()
      toast.success('TAG attribué au client')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch('/api/rfid/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfidTags'] })
      toast.success('TAG désactivé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const reactivateMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch('/api/rfid/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfidTags'] })
      toast.success('TAG réactivé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const replaceMutation = useMutation({
    mutationFn: async ({ oldTagId, newTagId }: { oldTagId: string; newTagId: string }) => {
      const res = await fetch('/api/rfid/replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldTagId, newTagId }),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfidTags'] })
      closeReplaceDialog()
      toast.success('TAG remplacé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // --- Client search ---

  const searchClients = useCallback(async (query: string) => {
    setClientSearch(query)
    if (query.length < 2) {
      setClientResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setClientResults(data.data)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }, [])

  // --- Dialog helpers ---

  function openAssignDialog(tag: RfidTag) {
    setAssignTag(tag)
    setClientSearch('')
    setClientResults([])
    setSelectedClient(null)
    setAssignDialogOpen(true)
  }

  function closeAssignDialog() {
    setAssignDialogOpen(false)
    setAssignTag(null)
    setSelectedClient(null)
    setClientSearch('')
    setClientResults([])
  }

  function openReplaceDialog(tag: RfidTag) {
    setReplaceTag(tag)
    setReplaceNewTagId('')
    setReplaceDialogOpen(true)
  }

  function closeReplaceDialog() {
    setReplaceDialogOpen(false)
    setReplaceTag(null)
    setReplaceNewTagId('')
  }

  // --- Filter ---

  const filteredTags = tags?.filter((tag) => {
    if (statusFilter === 'all') return true
    return tag.status === statusFilter
  })

  const availableTags = tags?.filter((tag) => tag.status === 'available') || []

  const statusColors: Record<string, string> = {
    available: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    deactivated: 'bg-red-100 text-red-800',
    lost: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('rfid.title')}</h1>
        <Dialog open={programDialogOpen} onOpenChange={setProgramDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />{t('rfid.actions.program')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{t('rfid.actions.program')}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('rfid.fields.tagId')}</Label>
                <Input value={newTagId} onChange={(e) => setNewTagId(e.target.value)} placeholder="ID-XXXXXX" />
              </div>
              <Button onClick={() => createMutation.mutate(newTagId)} disabled={!newTagId || createMutation.isPending} className="w-full">
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter by status */}
      <div className="flex items-center gap-2">
        <Label className="text-sm text-gray-500">Filtre :</Label>
        <div className="flex gap-1">
          {['all', 'available', 'active', 'deactivated', 'lost'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="text-xs">
              {s === 'all' ? 'Tous' : t(`rfid.statuses.${s}`)}
              {s !== 'all' && tags && <span className="ml-1 opacity-70">({tags.filter((tag) => tag.status === s).length})</span>}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('rfid.fields.tagId')}</TableHead>
                  <TableHead>{t('rfid.fields.client')}</TableHead>
                  <TableHead>{t('rfid.fields.status')}</TableHead>
                  <TableHead>Attribué le</TableHead>
                  <TableHead className="w-40 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags?.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-mono font-medium">{tag.tagId}</TableCell>
                    <TableCell>
                      {tag.client ? <span>{tag.client.firstName} {tag.client.lastName} ({tag.client.clientNumber})</span> : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[tag.status] || ''} variant="secondary">{t(`rfid.statuses.${tag.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{tag.assignedAt ? new Date(tag.assignedAt).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {tag.status === 'available' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" title="Attribuer à un client" onClick={() => openAssignDialog(tag)}>
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        {tag.status === 'active' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-600" title="Remplacer (perdu/volé)" onClick={() => openReplaceDialog(tag)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {tag.status === 'deactivated' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" title="Réactiver" onClick={() => setConfirmReactivateId(tag.tagId)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {(tag.status === 'active' || tag.status === 'available') && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="Désactiver" onClick={() => setConfirmDeactivateId(tag.tagId)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTags?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">Aucun TAG RFID</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog : Attribuer un TAG à un client */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => { if (!open) closeAssignDialog() }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Attribuer TAG {assignTag?.tagId}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rechercher un client</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={clientSearch} onChange={(e) => searchClients(e.target.value)} placeholder="Nom, téléphone ou numéro client..." className="pl-9" />
              </div>
            </div>
            {searching && <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Recherche...</div>}
            {clientResults.length > 0 && !selectedClient && (
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                {clientResults.map((c) => (
                  <button key={c.id} type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between items-center"
                    onClick={() => { setSelectedClient(c); setClientResults([]); setClientSearch(`${c.firstName} ${c.lastName}`) }}>
                    <span className="font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-gray-400 font-mono text-xs">{c.clientNumber}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
                <div>
                  <div className="font-medium text-sm">{selectedClient.firstName} {selectedClient.lastName}</div>
                  <div className="text-xs text-gray-500 font-mono">{selectedClient.clientNumber}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setClientSearch('') }}><XCircle className="h-4 w-4" /></Button>
              </div>
            )}
            <Button onClick={() => { if (assignTag && selectedClient) assignMutation.mutate({ tagId: assignTag.tagId, clientId: selectedClient.id }) }} disabled={!selectedClient || assignMutation.isPending} className="w-full">
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Attribuer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog : Remplacer un TAG */}
      <Dialog open={replaceDialogOpen} onOpenChange={(open) => { if (!open) closeReplaceDialog() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remplacer TAG {replaceTag?.tagId}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {replaceTag?.client && (
              <div className="text-sm bg-gray-50 rounded-md p-3">
                <span className="text-gray-500">Client :</span>{' '}
                <span className="font-medium">{replaceTag.client.firstName} {replaceTag.client.lastName} ({replaceTag.client.clientNumber})</span>
              </div>
            )}
            <div className="text-sm text-gray-500">L&apos;ancien TAG sera marqué comme perdu. Le nouveau TAG sera attribué au même client.</div>
            <div className="space-y-2">
              <Label>Nouveau TAG</Label>
              {availableTags.length > 0 ? (
                <Select value={replaceNewTagId} onValueChange={setReplaceNewTagId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un TAG disponible" /></SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => <SelectItem key={tag.id} value={tag.tagId}>{tag.tagId}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-orange-600">Aucun TAG disponible. Programmez d&apos;abord un nouveau TAG.</p>
              )}
            </div>
            <Button onClick={() => { if (replaceTag && replaceNewTagId) replaceMutation.mutate({ oldTagId: replaceTag.tagId, newTagId: replaceNewTagId }) }} disabled={!replaceNewTagId || replaceMutation.isPending} className="w-full">
              {replaceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Remplacer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReactivateId !== null} onOpenChange={(o) => !o && setConfirmReactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>Réactiver ce TAG ? Il redeviendra disponible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { reactivateMutation.mutate(confirmReactivateId!); setConfirmReactivateId(null) }}>
              {t('common.actions.activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeactivateId !== null} onOpenChange={(o) => !o && setConfirmDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirm.deactivate')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deactivateMutation.mutate(confirmDeactivateId!); setConfirmDeactivateId(null) }}>
              {t('common.actions.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
