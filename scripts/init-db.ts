#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...')
    
    await prisma.$executeRaw`PRAGMA journal_mode=WAL;`
    await prisma.$executeRaw`PRAGMA foreign_keys=ON;`
    
    console.log('✅ Database initialized successfully!')
    
    const userCount = await prisma.user.count()
    console.log(`📊 Current user count: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  initDatabase()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
