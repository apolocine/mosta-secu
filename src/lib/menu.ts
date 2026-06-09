// @mostajs/secu — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com
import { UserCheck, DoorOpen, CreditCard, Dumbbell, ClipboardList, ConciergeBell } from 'lucide-react'
import type { ModuleMenuContribution } from '@mostajs/menu'

export const secuMenuContribution: ModuleMenuContribution = {
  moduleKey: 'secu',
  order: 35,
  items: [
    { label: 'reception.title', href: '/dashboard/reception', icon: ConciergeBell, permission: 'access:view' },
    { label: 'clients.title', href: '/dashboard/clients', icon: UserCheck, permission: 'client:view' },
    { label: 'lockers.title', href: '/dashboard/lockers', icon: DoorOpen, permission: 'locker:view' },
    { label: 'rfid.title', href: '/dashboard/rfid', icon: CreditCard, permission: 'rfid:view' },
    { label: 'activities.title', href: '/dashboard/activities', icon: Dumbbell, permission: 'activity:view' },
    { label: 'access.plans.title', href: '/dashboard/plans', icon: ClipboardList, permission: 'access:view' },
  ],
}
