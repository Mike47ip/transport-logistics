// app/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creating System Tenant and Super Admin user...\n')

  // Hash the password
  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12)
  
  try {
    // First, check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { 
        email: 'admin@logitrack.com',
        role: 'SUPER_ADMIN'
      }
    })

    if (existingAdmin) {
      console.log('✅ Super Admin already exists!')
      console.log('📧 Email:', existingAdmin.email)
      console.log('👤 Name:', existingAdmin.name)
      console.log('🔑 Role:', existingAdmin.role)
      console.log('🆔 ID:', existingAdmin.id)
      
      console.log('\n🔐 Login Credentials:')
      console.log('Email: admin@logitrack.com')
      console.log('Password: SuperAdmin123!')
      console.log('\n🌐 Login at: http://localhost:3000/login')
      return
    }

    // Create or find system tenant for super admins
    let systemTenant = await prisma.tenant.findUnique({
      where: { slug: 'system-admin' }
    })

    if (!systemTenant) {
      systemTenant = await prisma.tenant.create({
        data: {
          name: 'System Administration',
          slug: 'system-admin',
          email: 'system@logitrack.com',
          isActive: true,
          settings: {
            create: {
              currency: 'USD',
              timezone: 'UTC'
            }
          }
        }
      })
      console.log('✅ System tenant created')
    }

    // Create Super Admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@logitrack.com',
        password: hashedPassword,
        name: 'Super Administrator',
        phone: '+1234567890',
        role: 'SUPER_ADMIN',
        tenantId: systemTenant.id,
        isActive: true
      },
    })

    console.log('✅ Super Admin created successfully!')
    console.log('📧 Email:', superAdmin.email)
    console.log('👤 Name:', superAdmin.name)
    console.log('🔑 Role:', superAdmin.role)
    console.log('🆔 ID:', superAdmin.id)
    console.log('🏢 Tenant:', systemTenant.name)
    
    console.log('\n🔐 Login Credentials:')
    console.log('Email: admin@logitrack.com')
    console.log('Password: SuperAdmin123!')
    console.log('\n⚠️  Please change the default password after first login!')
    console.log('\n🌐 Login at: http://localhost:3000/login')

  } catch (error) {
    console.error('❌ Error creating super admin:', error)
    
    if (error.code === 'P2002') {
      console.log('\n💡 Super admin already exists! Try logging in with:')
      console.log('Email: admin@logitrack.com')
      console.log('Password: SuperAdmin123!')
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('💥 Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })