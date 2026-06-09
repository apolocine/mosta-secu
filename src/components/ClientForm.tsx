// @mostajs/secu — Client creation/edit form component
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

interface ClientFormProps {
  initialData?: any
  isEditing?: boolean
  /** i18n translation function */
  t?: (key: string, params?: Record<string, string | number>) => string
  /** Optional FaceDetector component to inject */
  FaceDetector?: React.ComponentType<{
    photo: string
    onCapture: (data: { photo: string; faceDescriptor: number[] | null }) => void
    onClear: () => void
  }>
  /** API base path for clients endpoint */
  apiBasePath?: string
  /** Callback after successful save */
  onSuccess?: (client: any) => void
  /** Error notification callback */
  onError?: (message: string) => void
}

export default function ClientForm({
  initialData,
  isEditing,
  t = (k) => k,
  FaceDetector,
  apiBasePath = '/api/clients',
  onSuccess,
  onError,
}: ClientFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    clientType: initialData?.clientType || 'visiteur',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
      : '',
    gender: initialData?.gender || '',
    photo: initialData?.photo || '',
    faceDescriptor: initialData?.faceDescriptor || (null as number[] | null),
    address: initialData?.address || '',
    wilaya: initialData?.wilaya || '',
    notes: initialData?.notes || '',
  })

  const handleFaceCapture = useCallback(
    (data: { photo: string; faceDescriptor: number[] | null }) => {
      setForm((prev) => ({ ...prev, photo: data.photo, faceDescriptor: data.faceDescriptor }))
    },
    [],
  )

  const handlePhotoClear = useCallback(() => {
    setForm((prev) => ({ ...prev, photo: '', faceDescriptor: null }))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = isEditing ? `${apiBasePath}/${initialData.id}` : apiBasePath
    const method = isEditing ? 'PUT' : 'POST'

    try {
      const submitData: any = { ...form }
      if (!submitData.faceDescriptor) delete submitData.faceDescriptor

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Erreur')
      }

      const data = await res.json()
      // Invalidate cached client data so detail/list pages show fresh data
      await queryClient.invalidateQueries({ queryKey: ['client'] })
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      if (onSuccess) {
        onSuccess(data.data)
      } else {
        router.push(`/dashboard/clients/${data.data.id}`)
      }
    } catch (err: any) {
      if (onError) onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelStyle = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Client type */}
          <div>
            <label className={labelStyle}>{t('clients.fields.clientType')}</label>
            <select
              className={inputStyle}
              value={form.clientType}
              onChange={(e) => setForm({ ...form, clientType: e.target.value })}
            >
              <option value="visiteur">{t('clients.types.visiteur')}</option>
              <option value="abonne">{t('clients.types.abonne')}</option>
            </select>
          </div>

          {/* Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={labelStyle}>{t('clients.fields.firstName')}</label>
              <input
                className={inputStyle}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>{t('clients.fields.lastName')}</label>
              <input
                className={inputStyle}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={labelStyle}>{t('clients.fields.phone')}</label>
              <input
                className={inputStyle}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>{t('clients.fields.email')}</label>
              <input
                className={inputStyle}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Date + Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={labelStyle}>{t('clients.fields.dateOfBirth')}</label>
              <input
                className={inputStyle}
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>{t('clients.fields.gender')}</label>
              <select
                className={inputStyle}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="">—</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className={labelStyle}>{t('clients.fields.address')}</label>
              <input
                className={inputStyle}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>{t('clients.fields.wilaya')}</label>
              <input
                className={inputStyle}
                value={form.wilaya}
                onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelStyle}>{t('clients.fields.notes')}</label>
            <input
              className={inputStyle}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Right: photo / face */}
        <div>
          {FaceDetector ? (
            <FaceDetector
              photo={form.photo}
              onCapture={handleFaceCapture}
              onClear={handlePhotoClear}
            />
          ) : form.photo ? (
            <div>
              <img
                src={form.photo}
                alt="Photo"
                style={{ width: '100%', borderRadius: '8px', objectFit: 'cover' }}
              />
              <button type="button" onClick={handlePhotoClear} style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>
                {t('common.actions.clear')}
              </button>
            </div>
          ) : (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#9ca3af' }}>
              {t('clients.fields.photo')}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
        >
          {t('common.actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#93c5fd' : '#2563eb', color: 'white',
          }}
        >
          {loading ? '...' : t('common.actions.save')}
        </button>
      </div>
    </form>
  )
}
