// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://devuser:devpass26@localhost:27017/secuaccessdb'

// Schemas (standalone to avoid Next.js deps)
const CounterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
}, { collection: 'counters' })
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema)

const ClientSchema = new mongoose.Schema({
  clientNumber: { type: String, unique: true },
  clientType: { type: String, enum: ['abonne', 'visiteur'] },
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  dateOfBirth: Date,
  gender: String,
  photo: String,
  address: String,
  wilaya: String,
  qrCode: String,
  rfidTagId: { type: mongoose.Schema.Types.ObjectId },
  status: { type: String, default: 'active' },
  notes: String,
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true, collection: 'clients' })
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema)

const SubscriptionPlanSchema = new mongoose.Schema({
  name: String,
  description: String,
  type: { type: String, enum: ['temporal', 'usage', 'mixed'] },
  duration: Number,
  activities: [{
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    sessionsCount: Number,
  }],
  price: Number,
  currency: { type: String, default: 'DA' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'subscription_plans' })
const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', SubscriptionPlanSchema)

const ClientAccessSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  accessType: { type: String, enum: ['unlimited', 'count', 'temporal', 'mixed'] },
  totalQuota: Number,
  remainingQuota: Number,
  startDate: Date,
  endDate: Date,
  status: { type: String, default: 'active' },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true, collection: 'client_accesses' })
const ClientAccess = mongoose.models.ClientAccess || mongoose.model('ClientAccess', ClientAccessSchema)

const ActivitySchema = new mongoose.Schema({
  name: String, slug: String,
}, { collection: 'activities' })
const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)

const LockerSchema = new mongoose.Schema({
  number: { type: Number, unique: true },
  zone: String,
  status: { type: String, default: 'available' },
  rfidLockId: String,
  currentClient: mongoose.Schema.Types.ObjectId,
  currentTag: mongoose.Schema.Types.ObjectId,
  lastAssignedAt: Date,
}, { timestamps: true, collection: 'lockers' })
const Locker = mongoose.models.Locker || mongoose.model('Locker', LockerSchema)

const RfidTagSchema = new mongoose.Schema({
  tagId: { type: String, unique: true },
  client: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'available' },
  assignedAt: Date,
  deactivatedAt: Date,
  assignedBy: mongoose.Schema.Types.ObjectId,
  notes: String,
}, { timestamps: true, collection: 'rfidtags' })
const RfidTag = mongoose.models.RfidTag || mongoose.model('RfidTag', RfidTagSchema)

const UserSchema = new mongoose.Schema({
  email: String, role: String,
}, { collection: 'users' })
const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function getNextClientNumber(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    'clientNumber',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return `CLI-${String(counter.seq).padStart(5, '0')}`
}

const demoClients = [
  { firstName: 'Samir', lastName: 'Boudjema', phone: '0550100001', email: 'samir.b@email.dz', clientType: 'abonne', gender: 'male', wilaya: 'Alger' },
  { firstName: 'Amina', lastName: 'Khelifi', phone: '0550100002', email: 'amina.k@email.dz', clientType: 'abonne', gender: 'female', wilaya: 'Alger' },
  { firstName: 'Youcef', lastName: 'Rahmani', phone: '0550100003', email: 'youcef.r@email.dz', clientType: 'abonne', gender: 'male', wilaya: 'Blida' },
  { firstName: 'Leila', lastName: 'Mansouri', phone: '0550100004', email: 'leila.m@email.dz', clientType: 'abonne', gender: 'female', wilaya: 'Tipaza' },
  { firstName: 'Mehdi', lastName: 'Cherif', phone: '0550100005', email: 'mehdi.c@email.dz', clientType: 'abonne', gender: 'male', wilaya: 'Alger' },
  { firstName: 'Karima', lastName: 'Benali', phone: '0550100006', clientType: 'visiteur', gender: 'female', wilaya: 'Boumerdès' },
  { firstName: 'Omar', lastName: 'Djebbar', phone: '0550100007', clientType: 'visiteur', gender: 'male', wilaya: 'Alger' },
  { firstName: 'Fatima', lastName: 'Zeroual', phone: '0550100008', clientType: 'visiteur', gender: 'female', wilaya: 'Blida' },
  { firstName: 'Amine', lastName: 'Belkacem', phone: '0550100009', clientType: 'visiteur', gender: 'male', wilaya: 'Alger' },
  { firstName: 'Sarah', lastName: 'Hamdani', phone: '0550100010', clientType: 'visiteur', gender: 'female', wilaya: 'Tipaza' },
]

async function seedDemo() {
  console.log('[Seed Demo] Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('[Seed Demo] Connected')

  // Check if demo data already exists
  const existingClients = await Client.countDocuments()
  if (existingClients >= 10) {
    console.log(`[Seed Demo] ${existingClients} clients already exist, skipping demo seed`)
    await mongoose.disconnect()
    return
  }

  // --- 1. Create 10 demo clients ---
  console.log('[Seed Demo] Creating clients...')
  const createdClients: any[] = []
  for (const c of demoClients) {
    const clientNumber = await getNextClientNumber()
    const client = await Client.create({
      ...c,
      clientNumber,
      status: 'active',
    })
    // Set qrCode = _id
    client.qrCode = client._id.toString()
    await client.save()
    createdClients.push(client)
    console.log(`  - ${client.clientNumber}: ${c.firstName} ${c.lastName} (${c.clientType})`)
  }

  // Get admin user for createdBy
  const adminUser = await User.findOne({ role: 'admin' }).lean()
  const adminId = adminUser?._id

  // --- 2. Create 3 subscription plans ---
  console.log('[Seed Demo] Creating subscription plans...')
  const activities = await Activity.find({}).lean()
  const actBySlug = (slug: string) => activities.find((a: any) => a.slug === slug)

  const piscine = actBySlug('piscine')
  const tennis = actBySlug('tennis')
  const padel = actBySlug('padel')
  const football = actBySlug('football')
  const parcAttractions = actBySlug('parc-attractions')
  const espacesVerts = actBySlug('espaces-verts')
  const equitation = actBySlug('equitation')

  if (!piscine || !tennis || !padel || !football) {
    console.error('[Seed Demo] Activities not found. Run seed-activities first.')
    await mongoose.disconnect()
    return
  }

  const plans = [
    {
      name: 'Famille Mensuel',
      description: 'Abonnement famille : Piscine, Parc, Espaces Verts (30 jours)',
      type: 'temporal',
      duration: 30,
      activities: [
        { activity: piscine!._id, sessionsCount: null },
        { activity: parcAttractions!._id, sessionsCount: null },
        { activity: espacesVerts!._id, sessionsCount: null },
      ],
      price: 5000,
    },
    {
      name: 'Pack Sport 15',
      description: '15 séances : Tennis, Padel, Football',
      type: 'usage',
      duration: null,
      activities: [
        { activity: tennis!._id, sessionsCount: 15 },
        { activity: padel!._id, sessionsCount: 15 },
        { activity: football!._id, sessionsCount: 15 },
      ],
      price: 12000,
    },
    {
      name: 'Premium Mixte',
      description: '60 jours + quotas : Équitation 10, Piscine illimité, Tennis 20',
      type: 'mixed',
      duration: 60,
      activities: [
        { activity: equitation!._id, sessionsCount: 10 },
        { activity: piscine!._id, sessionsCount: null },
        { activity: tennis!._id, sessionsCount: 20 },
      ],
      price: 25000,
    },
  ]

  const createdPlans: any[] = []
  for (const p of plans) {
    const existing = await SubscriptionPlan.findOne({ name: p.name })
    if (existing) {
      createdPlans.push(existing)
      console.log(`  - Plan "${p.name}" already exists, skipping`)
    } else {
      const plan = await SubscriptionPlan.create(p)
      createdPlans.push(plan)
      console.log(`  - Plan "${p.name}" created (${p.type})`)
    }
  }

  // --- 3. Assign access to abonne clients ---
  console.log('[Seed Demo] Assigning access to subscribers...')
  const now = new Date()

  // Samir → Famille Mensuel
  const familyPlan = createdPlans[0]
  for (const act of familyPlan.activities) {
    await ClientAccess.create({
      client: createdClients[0]._id,
      plan: familyPlan._id,
      activity: act.activity,
      accessType: 'temporal',
      totalQuota: null,
      remainingQuota: null,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 86400000),
      status: 'active',
      createdBy: adminId,
    })
  }
  console.log('  - Samir → Famille Mensuel')

  // Amina → Pack Sport 15
  const sportPlan = createdPlans[1]
  for (const act of sportPlan.activities) {
    await ClientAccess.create({
      client: createdClients[1]._id,
      plan: sportPlan._id,
      activity: act.activity,
      accessType: 'count',
      totalQuota: act.sessionsCount,
      remainingQuota: act.sessionsCount,
      startDate: now,
      endDate: null,
      status: 'active',
      createdBy: adminId,
    })
  }
  console.log('  - Amina → Pack Sport 15')

  // Youcef → Premium Mixte
  const premiumPlan = createdPlans[2]
  for (const act of premiumPlan.activities) {
    await ClientAccess.create({
      client: createdClients[2]._id,
      plan: premiumPlan._id,
      activity: act.activity,
      accessType: act.sessionsCount ? 'mixed' : 'temporal',
      totalQuota: act.sessionsCount,
      remainingQuota: act.sessionsCount,
      startDate: now,
      endDate: new Date(now.getTime() + 60 * 86400000),
      status: 'active',
      createdBy: adminId,
    })
  }
  console.log('  - Youcef → Premium Mixte')

  // Leila → Famille Mensuel
  for (const act of familyPlan.activities) {
    await ClientAccess.create({
      client: createdClients[3]._id,
      plan: familyPlan._id,
      activity: act.activity,
      accessType: 'temporal',
      totalQuota: null,
      remainingQuota: null,
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 86400000),
      status: 'active',
      createdBy: adminId,
    })
  }
  console.log('  - Leila → Famille Mensuel')

  // Mehdi → Pack Sport 15
  for (const act of sportPlan.activities) {
    await ClientAccess.create({
      client: createdClients[4]._id,
      plan: sportPlan._id,
      activity: act.activity,
      accessType: 'count',
      totalQuota: act.sessionsCount,
      remainingQuota: act.sessionsCount,
      startDate: now,
      endDate: null,
      status: 'active',
      createdBy: adminId,
    })
  }
  console.log('  - Mehdi → Pack Sport 15')

  // --- 4. Create 80 lockers (3 zones) ---
  console.log('[Seed Demo] Creating lockers...')
  const existingLockers = await Locker.countDocuments()
  if (existingLockers > 0) {
    console.log(`  - ${existingLockers} lockers already exist, skipping`)
  } else {
    const lockerData: any[] = []
    for (let i = 1; i <= 30; i++) {
      lockerData.push({ number: i, zone: 'A', status: 'available' })
    }
    for (let i = 31; i <= 60; i++) {
      lockerData.push({ number: i, zone: 'B', status: 'available' })
    }
    for (let i = 61; i <= 80; i++) {
      lockerData.push({ number: i, zone: 'C', status: 'available' })
    }
    await Locker.insertMany(lockerData)
    console.log('  - 80 lockers created (A: 1-30, B: 31-60, C: 61-80)')
  }

  // --- 5. Create 10 RFID tags ---
  console.log('[Seed Demo] Creating RFID tags...')
  const existingTags = await RfidTag.countDocuments()
  if (existingTags > 0) {
    console.log(`  - ${existingTags} RFID tags already exist, skipping`)
  } else {
    const tagData = Array.from({ length: 10 }, (_, i) => ({
      tagId: `ID-${String(782541 + i)}`,
      status: 'available',
    }))
    await RfidTag.insertMany(tagData)
    console.log('  - 10 RFID tags created (ID-782541 to ID-782550)')
  }

  console.log('[Seed Demo] Demo data seeded successfully!')
  await mongoose.disconnect()
}

seedDemo().catch((err) => {
  console.error('[Seed Demo] Error:', err)
  process.exit(1)
})
