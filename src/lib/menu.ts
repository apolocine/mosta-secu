// @mostajs/secu — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com
import { UserCheck, DoorOpen, CreditCard } from 'lucide-react'
import type { ModuleMenuContribution } from '@mostajs/menu'

export const secuMenuContribution: ModuleMenuContribution = {
  moduleKey: 'secu',
  order: 35,
  items: [
    { label: 'clients.title', href: '/dashboard/clients', icon: UserCheck, permission: 'client:view' },
    { label: 'lockers.title', href: '/dashboard/lockers', icon: DoorOpen, permission: 'locker:view' },
    { label: 'rfid.title', href: '/dashboard/rfid', icon: CreditCard, permission: 'rfid:view' },
  ],
}
