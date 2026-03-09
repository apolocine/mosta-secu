// Author: Dr Hamid MADANI drmdh@msn.com
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://devuser:devpass26@localhost:27017/secuaccessdb'

const ActivitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  color: { type: String },
  capacity: { type: Number },
  currentOccupancy: { type: Number, default: 0 },
  schedule: [{ dayOfWeek: Number, openTime: String, closeTime: String, isOpen: Boolean }],
  ticketValidityMode: { type: String, enum: ['day_reentry', 'single_use', 'time_slot', 'unlimited'] },
  ticketDuration: { type: Number, default: null },
  price: { type: Number, required: true },
  currency: { type: String, default: 'DA' },
  status: { type: String, default: 'active' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true, collection: 'activities' })

const Activity = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)

const defaultSchedule = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: '08:00',
  closeTime: '20:00',
  isOpen: i !== 5, // Vendredi ferme
}))

const activities = [
  {
    name: 'Équitation',
    slug: 'equitation',
    description: 'Centre équestre avec manège couvert et piste extérieure',
    color: '#8B4513',
    capacity: 20,
    ticketValidityMode: 'time_slot',
    ticketDuration: 60,
    price: 2000,
    sortOrder: 1,
  },
  {
    name: 'Piscine',
    slug: 'piscine',
    description: 'Piscine olympique avec bassins adultes et enfants',
    color: '#0EA5E9',
    capacity: 100,
    ticketValidityMode: 'day_reentry',
    ticketDuration: null,
    price: 800,
    sortOrder: 2,
  },
  {
    name: 'Tennis',
    slug: 'tennis',
    description: '4 courts de tennis (2 terre battue, 2 synthétique)',
    color: '#22C55E',
    capacity: 16,
    ticketValidityMode: 'time_slot',
    ticketDuration: 60,
    price: 1000,
    sortOrder: 3,
  },
  {
    name: 'Padel',
    slug: 'padel',
    description: '2 terrains de padel couverts',
    color: '#6366F1',
    capacity: 8,
    ticketValidityMode: 'time_slot',
    ticketDuration: 60,
    price: 1200,
    sortOrder: 4,
  },
  {
    name: 'Football',
    slug: 'football',
    description: 'Terrain synthétique 5v5 et 7v7',
    color: '#16A34A',
    capacity: 30,
    ticketValidityMode: 'time_slot',
    ticketDuration: 90,
    price: 500,
    sortOrder: 5,
  },
  {
    name: 'Parc Attractions',
    slug: 'parc-attractions',
    description: 'Manèges, toboggans et aires de jeux',
    color: '#F59E0B',
    capacity: 200,
    ticketValidityMode: 'day_reentry',
    ticketDuration: null,
    price: 600,
    sortOrder: 6,
  },
  {
    name: 'Paintball',
    slug: 'paintball',
    description: 'Terrain de paintball avec équipement fourni',
    color: '#EF4444',
    capacity: 20,
    ticketValidityMode: 'single_use',
    ticketDuration: null,
    price: 1500,
    sortOrder: 7,
  },
  {
    name: 'Stade de Tir',
    slug: 'stade-tir',
    description: 'Stand de tir sportif (carabine, pistolet)',
    color: '#71717A',
    capacity: 10,
    ticketValidityMode: 'single_use',
    ticketDuration: null,
    price: 1000,
    sortOrder: 8,
  },
  {
    name: 'Restaurant',
    slug: 'restaurant',
    description: 'Restaurant principal avec terrasse',
    color: '#D97706',
    capacity: 80,
    ticketValidityMode: 'single_use',
    ticketDuration: null,
    price: 0,
    sortOrder: 9,
  },
  {
    name: 'Cafétéria',
    slug: 'cafeteria',
    description: 'Cafétéria et salon de thé',
    color: '#A16207',
    capacity: 40,
    ticketValidityMode: 'single_use',
    ticketDuration: null,
    price: 0,
    sortOrder: 10,
  },
  {
    name: 'Espaces Verts',
    slug: 'espaces-verts',
    description: 'Jardins, aires de pique-nique et promenades',
    color: '#15803D',
    capacity: 500,
    ticketValidityMode: 'day_reentry',
    ticketDuration: null,
    price: 300,
    sortOrder: 11,
  },
  {
    name: 'Vestiaires',
    slug: 'vestiaires',
    description: 'Vestiaires avec casiers RFID',
    color: '#7C3AED',
    capacity: 80,
    ticketValidityMode: 'day_reentry',
    ticketDuration: null,
    price: 0,
    sortOrder: 12,
  },
]

async function seedActivities() {
  console.log('[Seed] Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('[Seed] Connected')

  for (const act of activities) {
    const existing = await Activity.findOne({ slug: act.slug })
    if (existing) {
      console.log(`[Seed] Activity "${act.name}" already exists, skipping`)
      continue
    }

    await Activity.create({
      ...act,
      schedule: defaultSchedule,
      currency: 'DA',
      status: 'active',
    })
    console.log(`[Seed] Activity "${act.name}" created (${act.ticketValidityMode})`)
  }

  console.log('[Seed] Activities seeded successfully')
  await mongoose.disconnect()
}

seedActivities().catch((err) => {
  console.error('[Seed] Error:', err)
  process.exit(1)
})
