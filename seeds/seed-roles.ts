// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://devuser:devpass26@localhost:27017/secuaccessdb'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, required: true },
  permissions: [{ type: String }],
  status: { type: String, default: 'active' },
  lastLoginAt: { type: Date },
}, { timestamps: true, collection: 'users' })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

const ALL_PERMISSIONS = [
  'admin:access', 'admin:settings',
  'client:view', 'client:create', 'client:update', 'client:delete', 'client:search',
  'activity:view', 'activity:create', 'activity:update', 'activity:delete',
  'access:view', 'access:create', 'access:update', 'access:revoke',
  'ticket:create', 'ticket:view',
  'scan:validate', 'scan:view_history',
  'locker:view', 'locker:assign', 'locker:release', 'locker:manage',
  'rfid:view', 'rfid:program', 'rfid:deactivate', 'rfid:replace',
  'dashboard:view', 'dashboard:stats',
  'audit:view',
]

const AGENT_ACCUEIL_PERMISSIONS = [
  'client:view', 'client:create', 'client:update', 'client:search',
  'activity:view',
  'access:view', 'access:create', 'access:update',
  'ticket:create', 'ticket:view',
  'scan:validate', 'scan:view_history',
  'locker:view', 'locker:assign', 'locker:release',
  'rfid:view', 'rfid:program', 'rfid:deactivate', 'rfid:replace',
  'dashboard:view',
]

const AGENT_ATTRACTION_PERMISSIONS = [
  'activity:view',
  'access:view',
  'ticket:view',
  'scan:validate',
  'locker:view',
]

const SUPERVISEUR_PERMISSIONS = [
  'client:view', 'client:search',
  'activity:view',
  'access:view',
  'ticket:view',
  'scan:view_history',
  'locker:view',
  'dashboard:view', 'dashboard:stats',
  'audit:view',
]

async function seedRolesAndAdmin() {
  console.log('[Seed] Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('[Seed] Connected')

  // Admin user
  const adminEmail = 'admin@secuaccess.dz'
  const existing = await User.findOne({ email: adminEmail })
  if (existing) {
    console.log('[Seed] Admin user already exists, skipping')
  } else {
    const hashedPassword = await bcrypt.hash('Admin@123456', 12)
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'SecuAccess',
      phone: '0555000001',
      role: 'admin',
      permissions: ALL_PERMISSIONS,
      status: 'active',
    })
    console.log('[Seed] Admin user created: admin@secuaccess.dz / Admin@123456')
  }

  // Agent Accueil
  const agentAccueilEmail = 'accueil@secuaccess.dz'
  if (!(await User.findOne({ email: agentAccueilEmail }))) {
    const hashedPassword = await bcrypt.hash('Agent@123456', 12)
    await User.create({
      email: agentAccueilEmail,
      password: hashedPassword,
      firstName: 'Karim',
      lastName: 'Bensalem',
      phone: '0555000002',
      role: 'agent_accueil',
      permissions: AGENT_ACCUEIL_PERMISSIONS,
      status: 'active',
    })
    console.log('[Seed] Agent Accueil created: accueil@secuaccess.dz / Agent@123456')
  }

  // Agent Attraction
  const agentAttractionEmail = 'attraction@secuaccess.dz'
  if (!(await User.findOne({ email: agentAttractionEmail }))) {
    const hashedPassword = await bcrypt.hash('Agent@123456', 12)
    await User.create({
      email: agentAttractionEmail,
      password: hashedPassword,
      firstName: 'Yacine',
      lastName: 'Mebarki',
      phone: '0555000003',
      role: 'agent_attraction',
      permissions: AGENT_ATTRACTION_PERMISSIONS,
      status: 'active',
    })
    console.log('[Seed] Agent Attraction created: attraction@secuaccess.dz / Agent@123456')
  }

  // Superviseur
  const superviseurEmail = 'superviseur@secuaccess.dz'
  if (!(await User.findOne({ email: superviseurEmail }))) {
    const hashedPassword = await bcrypt.hash('Super@123456', 12)
    await User.create({
      email: superviseurEmail,
      password: hashedPassword,
      firstName: 'Nadia',
      lastName: 'Hamidi',
      phone: '0555000004',
      role: 'superviseur',
      permissions: SUPERVISEUR_PERMISSIONS,
      status: 'active',
    })
    console.log('[Seed] Superviseur created: superviseur@secuaccess.dz / Super@123456')
  }

  console.log('[Seed] Roles and users seeded successfully')
  await mongoose.disconnect()
}

seedRolesAndAdmin().catch((err) => {
  console.error('[Seed] Error:', err)
  process.exit(1)
})
