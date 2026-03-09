// @mostajs/secu — Access management grid component
// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback } from 'react'

interface AccessRecord {
  id: string
  accessType: string
  totalQuota: number | null
  remainingQuota: number | null
  endDate: string | null
  status: string
  ticketCount: number
  scanCount: number
  activity?: { id: string; name: string }
}

interface ActivityRecord {
  id: string
  name: string
  color?: string
}

interface PlanRecord {
  id: string
  name: string
  price: number
}

interface AccessGridProps {
  clientId: string
  /** Pre-fetched data: accesses + activities */
  accesses: AccessRecord[]
  activities: ActivityRecord[]
  plans?: PlanRecord[]
  /** i18n translation function */
  t?: (key: string, params?: Record<string, string | number>) => string
  /** API base path */
  apiBasePath?: string
  /** Callbacks */
  onAssigned?: () => void
  onRevoked?: () => void
  onError?: (message: string) => void
}

export default function AccessGrid({
  clientId,
  accesses,
  activities,
  plans = [],
  t = (k) => k,
  apiBasePath = '/api/clients',
  onAssigned,
  onRevoked,
  onError,
}: AccessGridProps) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignMode, setAssignMode] = useState<'plan' | 'manual'>('plan')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [manualForm, setManualForm] = useState({
    activityId: '',
    accessType: 'count',
    totalQuota: '',
    durationDays: '',
  })
  const [loading, setLoading] = useState(false)

  const accessMap = new Map<string, AccessRecord>(
    accesses.map((a) => [a.activity?.id ?? '', a]),
  )

  const handleAssign = useCallback(async () => {
    setLoading(true)
    try {
      const body =
        assignMode === 'plan'
          ? { planId: selectedPlan }
          : {
              activityId: manualForm.activityId,
              accessType: manualForm.accessType,
              totalQuota: manualForm.totalQuota ? Number(manualForm.totalQuota) : null,
              durationDays: manualForm.durationDays ? Number(manualForm.durationDays) : null,
            }

      const res = await fetch(`${apiBasePath}/${clientId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || 'Erreur')
      }
      setAssignOpen(false)
      onAssigned?.()
    } catch (err: any) {
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }, [assignMode, selectedPlan, manualForm, clientId, apiBasePath, onAssigned, onError])

  const handleRevoke = useCallback(
    async (accessId: string) => {
      try {
        const res = await fetch(`${apiBasePath}/${clientId}/access/${accessId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Erreur')
        onRevoked?.()
      } catch (err: any) {
        onError?.(err.message)
      }
    },
    [clientId, apiBasePath, onRevoked, onError],
  )

  const statusColors: Record<string, string> = {
    active: '#dcfce7', expired: '#fee2e2', blocked: '#f3f4f6', depleted: '#ffedd5',
  }

  const cellStyle = 'padding: 8px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 13px'

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <strong>{t('access.grid.title')}</strong>
        <button
          onClick={() => setAssignOpen(true)}
          style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}
        >
          + {t('access.grid.assign')}
        </button>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9fafb' }}>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600 }}>{t('access.fields.activity')}</th>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600 }}>{t('access.fields.accessType')}</th>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600 }}>Quota</th>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600 }}>Restant</th>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600 }}>{t('access.fields.status')}</th>
            <th style={{ ...parseStyle(cellStyle), fontWeight: 600, width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const access = accessMap.get(activity.id)
            return (
              <tr key={activity.id}>
                <td style={parseStyle(cellStyle)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {activity.color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activity.color, display: 'inline-block' }} />}
                    {activity.name}
                  </span>
                </td>
                <td style={parseStyle(cellStyle)}>
                  {access ? t(`access.types.${access.accessType}`) : '—'}
                </td>
                <td style={parseStyle(cellStyle)}>
                  {access?.totalQuota != null ? access.totalQuota : access ? '\u221E' : '—'}
                </td>
                <td style={parseStyle(cellStyle)}>
                  {access?.remainingQuota != null
                    ? access.remainingQuota
                    : access?.endDate
                      ? `${Math.max(0, Math.ceil((new Date(access.endDate).getTime() - Date.now()) / 86400000))} j`
                      : access
                        ? '\u221E'
                        : '—'}
                </td>
                <td style={parseStyle(cellStyle)}>
                  {access ? (
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', backgroundColor: statusColors[access.status] || '#f3f4f6' }}>
                      {t(`common.status.${access.status}`)}
                    </span>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '11px' }}>{t('access.grid.noAccess')}</span>
                  )}
                </td>
                <td style={parseStyle(cellStyle)}>
                  {access && access.status === 'active' && (
                    <button
                      onClick={() => handleRevoke(access.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}
                      title={t('access.grid.revoke')}
                    >
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Assign dialog (simple overlay) */}
      {assignOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '400px', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>{t('access.grid.assign')}</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setAssignMode('plan')} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: assignMode === 'plan' ? '#2563eb' : '#fff', color: assignMode === 'plan' ? '#fff' : '#000', cursor: 'pointer', fontSize: '12px' }}>Via plan</button>
              <button onClick={() => setAssignMode('manual')} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db', background: assignMode === 'manual' ? '#2563eb' : '#fff', color: assignMode === 'manual' ? '#fff' : '#000', cursor: 'pointer', fontSize: '12px' }}>Manuel</button>
            </div>

            {assignMode === 'plan' ? (
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
              >
                <option value="">Selectionner un plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.price} DA)</option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select
                  value={manualForm.activityId}
                  onChange={(e) => setManualForm({ ...manualForm, activityId: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option value="">Activite</option>
                  {activities.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select
                  value={manualForm.accessType}
                  onChange={(e) => setManualForm({ ...manualForm, accessType: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option value="unlimited">{t('access.types.unlimited')}</option>
                  <option value="count">{t('access.types.count')}</option>
                  <option value="temporal">{t('access.types.temporal')}</option>
                  <option value="mixed">{t('access.types.mixed')}</option>
                </select>
                {(manualForm.accessType === 'count' || manualForm.accessType === 'mixed') && (
                  <input type="number" placeholder="Nombre de sessions" value={manualForm.totalQuota} onChange={(e) => setManualForm({ ...manualForm, totalQuota: e.target.value })} min={1} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                )}
                {(manualForm.accessType === 'temporal' || manualForm.accessType === 'mixed') && (
                  <input type="number" placeholder="Duree (jours)" value={manualForm.durationDays} onChange={(e) => setManualForm({ ...manualForm, durationDays: e.target.value })} min={1} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setAssignOpen(false)} style={{ padding: '6px 14px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>{t('common.actions.cancel')}</button>
              <button onClick={handleAssign} disabled={loading} style={{ padding: '6px 14px', borderRadius: '4px', border: 'none', background: '#2563eb', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>{loading ? '...' : t('access.grid.assign')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Parse a CSS string into a React style object (simple helper) */
function parseStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {}
  css.split(';').forEach((rule) => {
    const [key, value] = rule.split(':').map((s) => s.trim())
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
      style[camelKey] = value
    }
  })
  return style as React.CSSProperties
}
