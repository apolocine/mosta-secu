// @mostajs/secu — Module-local i18n
// Author: Dr Hamid MADANI drmdh@msn.com

import common from '../../i18n/fr/common.json'
import clients from '../../i18n/fr/clients.json'
import lockers from '../../i18n/fr/lockers.json'
import rfid from '../../i18n/fr/rfid.json'
import access from '../../i18n/fr/access.json'

const translations: Record<string, Record<string, unknown>> = {
  common,
  clients,
  lockers,
  rfid,
  access,
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

export function t(key: string, params?: Record<string, string | number>): string {
  const [namespace, ...rest] = key.split('.')
  const ns = translations[namespace]
  if (!ns) return key

  let value = getNestedValue(ns as Record<string, unknown>, rest.join('.'))

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      value = value.replace(`{{${paramKey}}}`, String(paramValue))
    })
  }

  return value
}
