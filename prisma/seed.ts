import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

// 48 equipos del Mundial FIFA 2026 (12 grupos, 4 equipos cada uno)
const TEAMS = [
  // Grupo A
  { externalId: '6', name: 'Brasil', code: 'BRA', group: 'A' },
  { externalId: '10', name: 'México', code: 'MEX', group: 'A' },
  { externalId: '3', name: 'Estados Unidos', code: 'USA', group: 'A' },
  { externalId: '24', name: 'Camerún', code: 'CMR', group: 'A' },

  // Grupo B
  { externalId: '1', name: 'Argentina', code: 'ARG', group: 'B' },
  { externalId: '13', name: 'Perú', code: 'PER', group: 'B' },
  { externalId: '757', name: 'Canadá', code: 'CAN', group: 'B' },
  { externalId: '26', name: 'Marruecos', code: 'MAR', group: 'B' },

  // Grupo C
  { externalId: '9', name: 'España', code: 'ESP', group: 'C' },
  { externalId: '11', name: 'Países Bajos', code: 'NED', group: 'C' },
  { externalId: '5', name: 'Croacia', code: 'CRO', group: 'C' },
  { externalId: '34', name: 'Nigeria', code: 'NGA', group: 'C' },

  // Grupo D
  { externalId: '2', name: 'Francia', code: 'FRA', group: 'D' },
  { externalId: '7', name: 'Alemania', code: 'GER', group: 'D' },
  { externalId: '18', name: 'Colombia', code: 'COL', group: 'D' },
  { externalId: '761', name: 'Honduras', code: 'HON', group: 'D' },

  // Grupo E
  { externalId: '4', name: 'Portugal', code: 'POR', group: 'E' },
  { externalId: '768', name: 'Uruguay', code: 'URU', group: 'E' },
  { externalId: '8', name: 'Bélgica', code: 'BEL', group: 'E' },
  { externalId: '70', name: 'Irán', code: 'IRN', group: 'E' },

  // Grupo F
  { externalId: '12', name: 'Inglaterra', code: 'ENG', group: 'F' },
  { externalId: '21', name: 'Serbia', code: 'SRB', group: 'F' },
  { externalId: '23', name: 'Ecuador', code: 'ECU', group: 'F' },
  { externalId: '769', name: 'Costa Rica', code: 'CRC', group: 'F' },

  // Grupo G
  { externalId: '15', name: 'Italia', code: 'ITA', group: 'G' },
  { externalId: '16', name: 'Japón', code: 'JPN', group: 'G' },
  { externalId: '770', name: 'Arabia Saudita', code: 'KSA', group: 'G' },
  { externalId: '35', name: 'Senegal', code: 'SEN', group: 'G' },

  // Grupo H
  { externalId: '17', name: 'Corea del Sur', code: 'KOR', group: 'H' },
  { externalId: '25', name: 'Ghana', code: 'GHA', group: 'H' },
  { externalId: '771', name: 'Panamá', code: 'PAN', group: 'H' },
  { externalId: '772', name: 'Rumania', code: 'ROU', group: 'H' },

  // Grupo I
  { externalId: '773', name: 'Austria', code: 'AUT', group: 'I' },
  { externalId: '19', name: 'Chile', code: 'CHI', group: 'I' },
  { externalId: '774', name: 'Eslovaquia', code: 'SVK', group: 'I' },
  { externalId: '775', name: 'Túnez', code: 'TUN', group: 'I' },

  // Grupo J
  { externalId: '776', name: 'Suiza', code: 'SUI', group: 'J' },
  { externalId: '22', name: 'Venezuela', code: 'VEN', group: 'J' },
  { externalId: '777', name: 'República Checa', code: 'CZE', group: 'J' },
  { externalId: '778', name: 'Australia', code: 'AUS', group: 'J' },

  // Grupo K
  { externalId: '779', name: 'Turquía', code: 'TUR', group: 'K' },
  { externalId: '20', name: 'Paraguay', code: 'PAR', group: 'K' },
  { externalId: '780', name: 'Nueva Zelanda', code: 'NZL', group: 'K' },
  { externalId: '781', name: 'Mali', code: 'MLI', group: 'K' },

  // Grupo L
  { externalId: '782', name: 'Polonia', code: 'POL', group: 'L' },
  { externalId: '783', name: 'Bolivia', code: 'BOL', group: 'L' },
  { externalId: '784', name: 'Egipto', code: 'EGY', group: 'L' },
  { externalId: '785', name: 'Indonesia', code: 'IDN', group: 'L' },
]

async function main() {
  console.log('🌱 Iniciando seed...')

  // Cargar equipos
  let created = 0
  let skipped = 0
  for (const team of TEAMS) {
    const existing = await db.team.findUnique({ where: { code: team.code } })
    if (existing) { skipped++; continue }
    await db.team.create({ data: team })
    created++
  }
  console.log(`✅ Equipos: ${created} creados, ${skipped} ya existían`)

  // Crear admin inicial
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  ADMIN_EMAIL o ADMIN_PASSWORD no configurados. Saltando creación de admin.')
    return
  }

  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } })
  if (existingAdmin) {
    console.log('⚠️  Admin ya existe, saltando.')
    return
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await db.user.create({
    data: {
      email: adminEmail,
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log(`✅ Admin creado: ${adminEmail}`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
