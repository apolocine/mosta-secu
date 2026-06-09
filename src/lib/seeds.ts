// @mostajs/secu — Seed definitions for setup wizard
// Author: Dr Hamid MADANI drmdh@msn.com
// These seeds are optional and shown in the @mostajs/setup wizard
// when @mostajs/secu is installed in the host app.

export interface SecuSeedConfig {
  /** Factory to get repositories — called lazily to avoid circular deps */
  getRepos: () => Promise<{
    userRepo: any
    roleRepo: any
    clientRepo: any
    activityRepo: any
    subscriptionPlanRepo: any
    clientAccessRepo: any
    lockerRepo: any
    rfidTagRepo: any
  }>
  /** Hash password function from @mostajs/auth */
  hashPassword: (password: string) => Promise<string>
}

export interface SeedDefinition {
  key: string
  label: string
  description: string
  run: () => Promise<void>
}

// ─── Demo activities ──────────────────────────────────────────

const DEMO_ACTIVITIES = [
  { name: 'Equitation', slug: 'equitation', description: 'Centre equestre avec manege couvert et piste exterieure', color: '#8B4513', capacity: 20, ticketValidityMode: 'time_slot' as const, ticketDuration: 60, price: 2000, sortOrder: 1 },
  { name: 'Piscine', slug: 'piscine', description: 'Piscine olympique avec bassins adultes et enfants', color: '#0EA5E9', capacity: 100, ticketValidityMode: 'day_reentry' as const, ticketDuration: null, price: 800, sortOrder: 2 },
  { name: 'Tennis', slug: 'tennis', description: '4 courts de tennis (2 terre battue, 2 synthetique)', color: '#22C55E', capacity: 16, ticketValidityMode: 'time_slot' as const, ticketDuration: 60, price: 1000, sortOrder: 3 },
  { name: 'Padel', slug: 'padel', description: '2 terrains de padel couverts', color: '#6366F1', capacity: 8, ticketValidityMode: 'time_slot' as const, ticketDuration: 60, price: 1200, sortOrder: 4 },
  { name: 'Football', slug: 'football', description: 'Terrain synthetique 5v5 et 7v7', color: '#16A34A', capacity: 30, ticketValidityMode: 'time_slot' as const, ticketDuration: 90, price: 500, sortOrder: 5 },
  { name: 'Parc Attractions', slug: 'parc-attractions', description: 'Maneges, toboggans et aires de jeux', color: '#F59E0B', capacity: 200, ticketValidityMode: 'day_reentry' as const, ticketDuration: null, price: 600, sortOrder: 6 },
  { name: 'Paintball', slug: 'paintball', description: 'Terrain de paintball avec equipement fourni', color: '#EF4444', capacity: 20, ticketValidityMode: 'single_use' as const, ticketDuration: null, price: 1500, sortOrder: 7 },
  { name: 'Stade de Tir', slug: 'stade-tir', description: 'Stand de tir sportif (carabine, pistolet)', color: '#71717A', capacity: 10, ticketValidityMode: 'single_use' as const, ticketDuration: null, price: 1000, sortOrder: 8 },
  { name: 'Restaurant', slug: 'restaurant', description: 'Restaurant principal avec terrasse', color: '#D97706', capacity: 80, ticketValidityMode: 'single_use' as const, ticketDuration: null, price: 0, sortOrder: 9 },
  { name: 'Cafeteria', slug: 'cafeteria', description: 'Cafeteria et salon de the', color: '#A16207', capacity: 40, ticketValidityMode: 'single_use' as const, ticketDuration: null, price: 0, sortOrder: 10 },
  { name: 'Espaces Verts', slug: 'espaces-verts', description: 'Jardins, aires de pique-nique et promenades', color: '#15803D', capacity: 500, ticketValidityMode: 'day_reentry' as const, ticketDuration: null, price: 300, sortOrder: 11 },
  { name: 'Vestiaires', slug: 'vestiaires', description: 'Vestiaires avec casiers RFID', color: '#7C3AED', capacity: 80, ticketValidityMode: 'day_reentry' as const, ticketDuration: null, price: 0, sortOrder: 12 },
]

const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: '08:00',
  closeTime: '20:00',
  isOpen: i !== 5,
}))

async function seedActivities(aRepo: any) {
  for (const act of DEMO_ACTIVITIES) {
    const existing = await aRepo.findOne({ slug: act.slug })
    if (!existing) {
      await aRepo.create({ ...act, schedule: defaultSchedule, currency: 'DA', status: 'active' })
    }
  }
}

// ─── Demo users ───────────────────────────────────────────────

async function seedDemoUsers(uRepo: any, rRepo: any, hashPassword: (p: string) => Promise<string>) {
  const agentAccueilRole = await rRepo.findOne({ name: 'agent_accueil' })
  const agentAttractionRole = await rRepo.findOne({ name: 'agent_attraction' })
  const superviseurRole = await rRepo.findOne({ name: 'superviseur' })

  const demoUsers = [
    { email: 'accueil@secuaccess.dz', password: 'Agent@123456', firstName: 'Karim', lastName: 'Bensalem', roles: agentAccueilRole ? [agentAccueilRole.id] : [] },
    { email: 'attraction@secuaccess.dz', password: 'Agent@123456', firstName: 'Yacine', lastName: 'Mebarki', roles: agentAttractionRole ? [agentAttractionRole.id] : [] },
    { email: 'superviseur@secuaccess.dz', password: 'Super@123456', firstName: 'Nadia', lastName: 'Hamidi', roles: superviseurRole ? [superviseurRole.id] : [] },
  ]

  for (const u of demoUsers) {
    const existing = await uRepo.findOne({ email: u.email })
    if (!existing) {
      const hashed = await hashPassword(u.password)
      await uRepo.create({ email: u.email, password: hashed, firstName: u.firstName, lastName: u.lastName, roles: u.roles, status: 'active' })
    }
  }
}

// ─── Demo data (clients, plans, access, lockers, RFID) ───────

const demoClients = [
  { firstName: 'Samir', lastName: 'Boudjema', phone: '0550100001', email: 'samir.b@email.dz', clientType: 'abonne' as const, gender: 'male' as const, wilaya: 'Alger' },
  { firstName: 'Amina', lastName: 'Khelifi', phone: '0550100002', email: 'amina.k@email.dz', clientType: 'abonne' as const, gender: 'female' as const, wilaya: 'Alger' },
  { firstName: 'Youcef', lastName: 'Rahmani', phone: '0550100003', email: 'youcef.r@email.dz', clientType: 'abonne' as const, gender: 'male' as const, wilaya: 'Blida' },
  { firstName: 'Leila', lastName: 'Mansouri', phone: '0550100004', email: 'leila.m@email.dz', clientType: 'abonne' as const, gender: 'female' as const, wilaya: 'Tipaza' },
  { firstName: 'Mehdi', lastName: 'Cherif', phone: '0550100005', email: 'mehdi.c@email.dz', clientType: 'abonne' as const, gender: 'male' as const, wilaya: 'Alger' },
  { firstName: 'Karima', lastName: 'Benali', phone: '0550100006', clientType: 'visiteur' as const, gender: 'female' as const, wilaya: 'Boumerdes' },
  { firstName: 'Omar', lastName: 'Djebbar', phone: '0550100007', clientType: 'visiteur' as const, gender: 'male' as const, wilaya: 'Alger' },
  { firstName: 'Fatima', lastName: 'Zeroual', phone: '0550100008', clientType: 'visiteur' as const, gender: 'female' as const, wilaya: 'Blida' },
  { firstName: 'Amine', lastName: 'Belkacem', phone: '0550100009', clientType: 'visiteur' as const, gender: 'male' as const, wilaya: 'Alger' },
  { firstName: 'Sarah', lastName: 'Hamdani', phone: '0550100010', clientType: 'visiteur' as const, gender: 'female' as const, wilaya: 'Tipaza' },
]

async function seedDemoData(
  uRepo: any, cRepo: any, aRepo: any, spRepo: any, caRepo: any, lRepo: any, rtRepo: any,
) {
  const existingClients = await cRepo.count()
  if (existingClients >= 10) return

  const adminUser = await uRepo.findOne({ status: 'active' })
  const adminId = adminUser?.id
  if (!adminId) return

  const createdClients: { id: string }[] = []
  for (const c of demoClients) {
    const client = await cRepo.create({ ...c, status: 'active', createdBy: adminId })
    createdClients.push(client)
  }

  const activities = await aRepo.findAll()
  const actBySlug = (slug: string) => activities.find((a: any) => a.slug === slug)

  const piscine = actBySlug('piscine')
  const tennis = actBySlug('tennis')
  const padel = actBySlug('padel')
  const football = actBySlug('football')
  const parcAttractions = actBySlug('parc-attractions')
  const espacesVerts = actBySlug('espaces-verts')
  const equitation = actBySlug('equitation')

  if (piscine && tennis && padel && football && parcAttractions && espacesVerts && equitation) {
    const plans = [
      { name: 'Famille Mensuel', description: 'Abonnement famille : Piscine, Parc, Espaces Verts (30 jours)', type: 'temporal' as const, duration: 30, activities: [{ activity: piscine.id, sessionsCount: null }, { activity: parcAttractions.id, sessionsCount: null }, { activity: espacesVerts.id, sessionsCount: null }], price: 5000 },
      { name: 'Pack Sport 15', description: '15 seances : Tennis, Padel, Football', type: 'usage' as const, duration: null, activities: [{ activity: tennis.id, sessionsCount: 15 }, { activity: padel.id, sessionsCount: 15 }, { activity: football.id, sessionsCount: 15 }], price: 12000 },
      { name: 'Premium Mixte', description: '60 jours + quotas : Equitation 10, Piscine illimite, Tennis 20', type: 'mixed' as const, duration: 60, activities: [{ activity: equitation.id, sessionsCount: 10 }, { activity: piscine.id, sessionsCount: null }, { activity: tennis.id, sessionsCount: 20 }], price: 25000 },
    ]

    const createdPlans: { id: string; activities?: unknown[] }[] = []
    for (const p of plans) {
      const existing = await spRepo.findOne({ name: p.name })
      createdPlans.push(existing || await spRepo.create(p))
    }

    const now = new Date().toISOString()
    const assignAccess = async (clientIdx: number, plan: typeof createdPlans[0], planDef: typeof plans[0], accessType: 'unlimited' | 'count' | 'temporal' | 'mixed', days: number | null) => {
      for (const act of planDef.activities) {
        await caRepo.create({
          client: createdClients[clientIdx].id,
          plan: plan.id,
          activity: act.activity,
          accessType,
          totalQuota: ('sessionsCount' in act ? act.sessionsCount : null) || null,
          remainingQuota: ('sessionsCount' in act ? act.sessionsCount : null) || null,
          startDate: now,
          endDate: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
          status: 'active',
          createdBy: adminId,
        })
      }
    }

    await assignAccess(0, createdPlans[0], plans[0], 'temporal', 30)
    await assignAccess(1, createdPlans[1], plans[1], 'count', null)
    await assignAccess(2, createdPlans[2], plans[2], 'mixed', 60)
    await assignAccess(3, createdPlans[0], plans[0], 'temporal', 30)
    await assignAccess(4, createdPlans[1], plans[1], 'count', null)
  }

  const existingLockers = await lRepo.count()
  if (existingLockers === 0) {
    for (let i = 1; i <= 30; i++) await lRepo.create({ number: i, zone: 'A', status: 'available' })
    for (let i = 31; i <= 60; i++) await lRepo.create({ number: i, zone: 'B', status: 'available' })
    for (let i = 61; i <= 80; i++) await lRepo.create({ number: i, zone: 'C', status: 'available' })
  }

  const existingTags = await rtRepo.count()
  if (existingTags === 0) {
    for (let i = 0; i < 10; i++) {
      await rtRepo.create({ tagId: `ID-${String(782541 + i)}`, status: 'available' })
    }
  }
}

// ─── Public API: createSecuSeeds() ────────────────────────────

/**
 * Creates SeedDefinition[] compatible with @mostajs/setup wizard.
 * Call this in your app's setup.ts to register secu demo seeds.
 *
 * @example
 * import { createSecuSeeds } from '@mostajs/secu/lib/seeds'
 *
 * const secuSeeds = createSecuSeeds({
 *   getRepos: async () => {
 *     const s = await import('@/dal/service')
 *     return {
 *       userRepo: await s.userRepo(),
 *       roleRepo: await s.roleRepo(),
 *       clientRepo: await s.clientRepo(),
 *       activityRepo: await s.activityRepo(),
 *       subscriptionPlanRepo: await s.subscriptionPlanRepo(),
 *       clientAccessRepo: await s.clientAccessRepo(),
 *       lockerRepo: await s.lockerRepo(),
 *       rfidTagRepo: await s.rfidTagRepo(),
 *     }
 *   },
 *   hashPassword: (await import('@mostajs/auth/lib/password')).hashPassword,
 * })
 */
export function createSecuSeeds(config: SecuSeedConfig): SeedDefinition[] {
  const { getRepos, hashPassword } = config

  return [
    {
      key: 'activities',
      label: 'Activites de demonstration',
      description: '12 activites pre-configurees (piscine, tennis, equitation...)',
      run: async () => {
        const { activityRepo } = await getRepos()
        await seedActivities(activityRepo)
      },
    },
    {
      key: 'demoUsers',
      label: 'Utilisateurs de demonstration',
      description: '3 utilisateurs (agent accueil, agent attraction, superviseur)',
      run: async () => {
        const { userRepo, roleRepo } = await getRepos()
        await seedDemoUsers(userRepo, roleRepo, hashPassword)
      },
    },
    {
      key: 'demoData',
      label: 'Donnees de demonstration',
      description: '10 clients, 3 abonnements, 80 casiers, 10 cartes RFID',
      run: async () => {
        const repos = await getRepos()
        // Ensure activities exist first
        const count = await repos.activityRepo.count()
        if (count === 0) await seedActivities(repos.activityRepo)
        await seedDemoData(
          repos.userRepo, repos.clientRepo, repos.activityRepo,
          repos.subscriptionPlanRepo, repos.clientAccessRepo,
          repos.lockerRepo, repos.rfidTagRepo,
        )
      },
    },
  ]
}

// ─── SeedFactory (runtime registry format) ───────────────────

/**
 * SeedFactory compatible with @mostajs/socle's SeedContext.
 * Used when secu registers its seeds via register().
 */
export function secuSeedFactory(context: {
  getRepository: (name: string) => Promise<unknown>
  hashPassword: (password: string) => Promise<string>
  log: (msg: string) => void
}) {
  return [
    {
      name: 'secu:activities',
      description: '12 activites pre-configurees (piscine, tennis, equitation...)',
      run: async () => {
        const activityRepo = await context.getRepository('activityRepo') as any
        await seedActivities(activityRepo)
      },
    },
    {
      name: 'secu:demoUsers',
      description: '3 utilisateurs (agent accueil, agent attraction, superviseur)',
      run: async () => {
        const userRepo = await context.getRepository('userRepo') as any
        const roleRepo = await context.getRepository('roleRepo') as any
        await seedDemoUsers(userRepo, roleRepo, context.hashPassword)
      },
    },
    {
      name: 'secu:demoData',
      description: '10 clients, 3 abonnements, 80 casiers, 10 cartes RFID',
      run: async () => {
        const activityRepo = await context.getRepository('activityRepo') as any
        const count = await activityRepo.count()
        if (count === 0) await seedActivities(activityRepo)
        await seedDemoData(
          await context.getRepository('userRepo') as any,
          await context.getRepository('clientRepo') as any,
          activityRepo,
          await context.getRepository('subscriptionPlanRepo') as any,
          await context.getRepository('clientAccessRepo') as any,
          await context.getRepository('lockerRepo') as any,
          await context.getRepository('rfidTagRepo') as any,
        )
      },
    },
  ]
}
