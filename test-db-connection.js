// Test database connection script
// Run with: node test-db-connection.js

const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`✅ Found ${userCount} users in database`)
    
    // Test if new tables exist (this will fail if migration hasn't run)
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM webhooks`
      console.log('✅ Webhook tables exist - migration already applied!')
    } catch (error) {
      console.log('⚠️  Webhook tables do not exist - migration needed')
      console.log('   Run the SQL migration script in your Supabase dashboard')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('\n🔧 Troubleshooting steps:')
    console.log('1. Check your internet connection')
    console.log('2. Verify DATABASE_URL in .env file')
    console.log('3. Check if Supabase project is active (not paused)')
    console.log('4. Ensure database credentials are correct')
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()