// @mostajs/secu — Subscription plans page
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
import { Checkbox } from '@mostajs/ui/checkbox'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { t } from '../lib/i18n.js'

interface Activity { id: string; name: string; slug: string }
interface Plan {
  id: string; name: string; description?: string; type: string; duration: number | null
  activities: { activity: Activity; sessionsCount: number | null }[]
  price: number; isActive: boolean
}

export default function PlansPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', type: 'temporal', duration: '', price: '', isActive: true,
    selectedActivities: [] as { activityId: string; sessionsCount: string }[],
  })

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const res = await fetch('/api/subscription-plans'); if (!res.ok) throw new Error('Erreur'); return (await res.json()).data as Plan[] },
  })

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => { const res = await fetch('/api/activities'); if (!res.ok) throw new Error('Erreur'); return (await res.json()).data as Activity[] },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/subscription-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setDialogOpen(false); toast.success('Plan créé') },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/subscription-plans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error((await res.json()).error?.message || 'Erreur')
      return (await res.json()).data
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); setDialogOpen(false); setEditingPlan(null); toast.success('Plan modifié') },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/subscription-plans/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Erreur') },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan supprimé') },
  })

  function resetForm() { setForm({ name: '', description: '', type: 'temporal', duration: '', price: '', isActive: true, selectedActivities: [] }) }
  function openCreate() { resetForm(); setEditingPlan(null); setDialogOpen(true) }
  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name, description: plan.description || '', type: plan.type,
      duration: plan.duration != null ? String(plan.duration) : '', price: String(plan.price), isActive: plan.isActive,
      selectedActivities: plan.activities.map((a) => ({ activityId: a.activity?.id || '', sessionsCount: a.sessionsCount != null ? String(a.sessionsCount) : '' })),
    })
    setDialogOpen(true)
  }

  function toggleActivity(activityId: string) {
    setForm((prev) => {
      const exists = prev.selectedActivities.find((a) => a.activityId === activityId)
      if (exists) return { ...prev, selectedActivities: prev.selectedActivities.filter((a) => a.activityId !== activityId) }
      return { ...prev, selectedActivities: [...prev.selectedActivities, { activityId, sessionsCount: '' }] }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      name: form.name, description: form.description || undefined, type: form.type,
      duration: form.duration ? Number(form.duration) : null, price: Number(form.price), isActive: form.isActive,
      activities: form.selectedActivities.map((a) => ({ activity: a.activityId, sessionsCount: a.sessionsCount ? Number(a.sessionsCount) : null })),
    }
    if (editingPlan) { updateMutation.mutate({ id: editingPlan.id, data }) }
    else { createMutation.mutate(data) }
  }

  const typeColors: Record<string, string> = { temporal: 'bg-blue-100 text-blue-800', usage: 'bg-orange-100 text-orange-800', mixed: 'bg-purple-100 text-purple-800' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('access.plans.title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{t('access.plans.create')}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPlan ? 'Modifier le plan' : t('access.plans.create')}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Nom du plan</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temporal">{t('access.planTypes.temporal')}</SelectItem>
                      <SelectItem value="usage">{t('access.planTypes.usage')}</SelectItem>
                      <SelectItem value="mixed">{t('access.planTypes.mixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Prix (DA)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min={0} /></div>
              </div>
              {(form.type === 'temporal' || form.type === 'mixed') && (
                <div className="space-y-2"><Label>Durée (jours)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} min={1} /></div>
              )}
              <div className="space-y-2">
                <Label>Activités incluses</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {activities?.map((activity) => {
                    const selected = form.selectedActivities.find((a) => a.activityId === activity.id)
                    return (
                      <div key={activity.id} className="flex items-center gap-3">
                        <Checkbox checked={!!selected} onCheckedChange={() => toggleActivity(activity.id)} />
                        <span className="flex-1 text-sm">{activity.name}</span>
                        {selected && (form.type === 'usage' || form.type === 'mixed') && (
                          <Input type="number" placeholder="Sessions" className="w-24 h-8 text-xs" value={selected.sessionsCount}
                            onChange={(e) => setForm((prev) => ({ ...prev, selectedActivities: prev.selectedActivities.map((a) => a.activityId === activity.id ? { ...a, sessionsCount: e.target.value } : a) }))} min={1} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t('common.actions.cancel')}</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                  <TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Durée</TableHead>
                  <TableHead>Activités</TableHead><TableHead>Prix</TableHead><TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell><Badge className={typeColors[plan.type] || ''} variant="secondary">{t(`access.planTypes.${plan.type}`)}</Badge></TableCell>
                    <TableCell>{plan.duration ? `${plan.duration} jours` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.activities.map((a, i) => (
                          <Badge key={a.activity?.id || i} variant="outline" className="text-xs">
                            {a.activity?.name}{a.sessionsCount ? ` (${a.sessionsCount})` : ''}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{plan.price} DA</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(plan)} className="h-8 w-8 text-blue-600"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm(t('common.confirm.delete'))) deleteMutation.mutate(plan.id) }} className="h-8 w-8 text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {plans?.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Aucun plan</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
