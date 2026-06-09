// @mostajs/secu — Clients list page
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@mostajs/ui/button'
import { Input } from '@mostajs/ui/input'
import { Badge } from '@mostajs/ui/badge'
import { Card, CardContent } from '@mostajs/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@mostajs/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mostajs/ui/select'
import { Plus, Search, Eye, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@mostajs/ui/alert-dialog'
import { toast } from 'sonner'
import { t } from '../lib/i18n.js'

interface Client {
  id: string
  clientNumber: string
  clientType: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  photo?: string
  status: string
  createdAt: string
}

export default function ClientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const limit = 30

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      params.set('page', String(page))
      params.set('limit', String(limit))
      const res = await fetch(`/api/clients?${params}`)
      if (!res.ok) throw new Error('Erreur')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Client désactivé')
    },
  })

  const clients: Client[] = data?.data || []
  const meta = data?.meta || { total: 0, page: 1, limit, pages: 1 }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    setPage(1)
  }

  const typeColors: Record<string, string> = {
    abonne: 'bg-blue-100 text-blue-800',
    visiteur: 'bg-amber-100 text-amber-800',
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('clients.title')}</h1>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('clients.create')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t('clients.search.placeholder')}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="abonne">{t('clients.types.abonne')}</SelectItem>
            <SelectItem value="visiteur">{t('clients.types.visiteur')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('clients.fields.clientNumber')}</TableHead>
                  <TableHead>{t('clients.fields.lastName')}</TableHead>
                  <TableHead>{t('clients.fields.phone')}</TableHead>
                  <TableHead>{t('clients.fields.clientType')}</TableHead>
                  <TableHead>{t('clients.fields.status')}</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">{client.clientNumber}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {client.photo ? (
                          <img src={client.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                        )}
                        {client.firstName} {client.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={typeColors[client.clientType] || ''} variant="secondary">
                        {t(`clients.types.${client.clientType}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[client.status] || ''} variant="secondary">
                        {t(`common.status.${client.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeleteId(client.id)}
                          className="h-8 w-8 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {meta.total} client{meta.total > 1 ? 's' : ''} — page {meta.page} / {meta.pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirm.deactivate')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteMutation.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
            >
              {t('common.actions.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
