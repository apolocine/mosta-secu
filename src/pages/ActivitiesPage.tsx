// @mostajs/secu — Activities management page
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@mostajs/ui/button'
import { Input } from '@mostajs/ui/input'
import { Label } from '@mostajs/ui/label'
import { Badge } from '@mostajs/ui/badge'
import { Card, CardContent } from '@mostajs/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@mostajs/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@mostajs/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@mostajs/ui/table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '../lib/i18n.js'

interface Activity {
  id: string
  name: string
  slug: string
  description?: string
  capacity?: number
  currentOccupancy: number
  ticketValidityMode: string
  ticketDuration: number | null
  price: number
  status: string
  sortOrder: number
}

const validityModeColors: Record<string, string> = {
  day_reentry: 'bg-blue-100 text-blue-800',
  single_use: 'bg-orange-100 text-orange-800',
  time_slot: 'bg-purple-100 text-purple-800',
  unlimited: 'bg-green-100 text-green-800',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function ActivitiesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [form, setForm] = useState({
    name: '', slug: '', description: '', capacity: '',
    ticketValidityMode: 'single_use', ticketDuration: '',
    price: '', status: 'active', sortOrder: '0',
  })

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await fetch('/api/activities')
      if (!res.ok) throw new Error('Erreur')
      return (await res.json()).data as Activity[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); setDialogOpen(false); resetForm(); toast.success('Activité créée') },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/activities/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); setDialogOpen(false); setEditingActivity(null); resetForm(); toast.success('Activité modifiée') },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/activities/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activities'] }); toast.success('Activité supprimée') },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', slug: '', description: '', capacity: '', ticketValidityMode: 'single_use', ticketDuration: '', price: '', status: 'active', sortOrder: '0' })
  }

  function openCreate() { resetForm(); setEditingActivity(null); setDialogOpen(true) }

  function openEdit(activity: Activity) {
    setEditingActivity(activity)
    setForm({
      name: activity.name, slug: activity.slug, description: activity.description || '',
      capacity: activity.capacity?.toString() || '', ticketValidityMode: activity.ticketValidityMode,
      ticketDuration: activity.ticketDuration?.toString() || '', price: activity.price.toString(),
      status: activity.status, sortOrder: activity.sortOrder.toString(),
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      name: form.name, slug: form.slug, description: form.description || undefined,
      capacity: form.capacity ? Number(form.capacity) : undefined,
      ticketValidityMode: form.ticketValidityMode,
      ticketDuration: form.ticketDuration ? Number(form.ticketDuration) : null,
      price: Number(form.price), status: form.status, sortOrder: Number(form.sortOrder),
    }
    if (editingActivity) { updateMutation.mutate({ id: editingActivity.id, data }) }
    else { createMutation.mutate(data) }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('activities.title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('activities.create')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingActivity ? t('common.actions.edit') : t('activities.create')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('activities.fields.name')}</Label>
                  <Input value={form.name} onChange={(e) => { const name = e.target.value; setForm({ ...form, name, slug: editingActivity ? form.slug : slugify(name) }) }} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('activities.fields.slug')}</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('activities.fields.description')}</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('activities.fields.capacity')}</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} min={0} />
                </div>
                <div className="space-y-2">
                  <Label>{t('activities.fields.price')} (DA)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min={0} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('activities.fields.ticketValidityMode')}</Label>
                  <Select value={form.ticketValidityMode} onValueChange={(v) => setForm({ ...form, ticketValidityMode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day_reentry">{t('activities.validityModes.day_reentry')}</SelectItem>
                      <SelectItem value="single_use">{t('activities.validityModes.single_use')}</SelectItem>
                      <SelectItem value="time_slot">{t('activities.validityModes.time_slot')}</SelectItem>
                      <SelectItem value="unlimited">{t('activities.validityModes.unlimited')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.ticketValidityMode === 'time_slot' && (
                  <div className="space-y-2">
                    <Label>{t('activities.fields.ticketDuration')}</Label>
                    <Input type="number" value={form.ticketDuration} onChange={(e) => setForm({ ...form, ticketDuration: e.target.value })} min={1} placeholder="60" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('activities.fields.status')}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('common.status.active')}</SelectItem>
                      <SelectItem value="inactive">{t('common.status.inactive')}</SelectItem>
                      <SelectItem value="maintenance">{t('common.status.maintenance')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordre</Label>
                  <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} min={0} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.actions.cancel')}</Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('common.actions.save')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('activities.fields.name')}</TableHead>
                  <TableHead>{t('activities.fields.ticketValidityMode')}</TableHead>
                  <TableHead>{t('activities.fields.ticketDuration')}</TableHead>
                  <TableHead>{t('activities.fields.price')}</TableHead>
                  <TableHead>{t('activities.fields.capacity')}</TableHead>
                  <TableHead>{t('activities.fields.status')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.name}</TableCell>
                    <TableCell>
                      <Badge className={validityModeColors[activity.ticketValidityMode] || ''} variant="secondary">
                        {t(`activities.validityModes.${activity.ticketValidityMode}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{activity.ticketDuration ? `${activity.ticketDuration} min` : '-'}</TableCell>
                    <TableCell>{activity.price} DA</TableCell>
                    <TableCell>{activity.capacity || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[activity.status] || ''} variant="secondary">
                        {t(`common.status.${activity.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(activity)} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('common.confirm.delete'))) deleteMutation.mutate(activity.id) }} className="h-8 w-8 text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {activities?.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Aucune activité</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
