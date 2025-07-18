import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@linkvaultpro.com' },
    update: {},
    create: {
      email: 'admin@linkvaultpro.com',
      role: 'ADMIN',
      isActive: true,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          timezone: 'UTC',
          theme: 'SYSTEM',
          language: 'en',
          emailNotifications: {
            create: {
              newConversions: true,
              weeklyReports: true,
              systemUpdates: true
            }
          },
          pushNotifications: {
            create: {
              realTimeAlerts: false,
              dailySummary: true
            }
          }
        }
      }
    },
    include: {
      profile: true
    }
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create default platforms
  const platforms = [
    {
      name: 'amazon',
      displayName: 'Amazon',
      baseUrl: 'https://amazon.com',
      isActive: true
    },
    {
      name: 'lazada',
      displayName: 'Lazada',
      baseUrl: 'https://lazada.com.ph',
      isActive: true
    },
    {
      name: 'shopee',
      displayName: 'Shopee',
      baseUrl: 'https://shopee.ph',
      isActive: true
    },
    {
      name: 'tiktok',
      displayName: 'TikTok Shop',
      baseUrl: 'https://shop.tiktok.com',
      isActive: true
    },
    {
      name: 'aliexpress',
      displayName: 'AliExpress',
      baseUrl: 'https://aliexpress.com',
      isActive: true
    }
  ]

  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: {},
      create: platform
    })
  }

  console.log('✅ Created default platforms')

  // Create default categories
  const categories = [
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and gadgets',
      order: 1,
      createdBy: adminUser.id
    },
    {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
      order: 2,
      createdBy: adminUser.id
    },
    {
      name: 'Home & Garden',
      slug: 'home-garden',
      description: 'Home improvement and garden supplies',
      order: 3,
      createdBy: adminUser.id
    },
    {
      name: 'Health & Beauty',
      slug: 'health-beauty',
      description: 'Health, wellness, and beauty products',
      order: 4,
      createdBy: adminUser.id
    },
    {
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      description: 'Sports equipment and outdoor gear',
      order: 5,
      createdBy: adminUser.id
    }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category
    })
  }

  console.log('✅ Created default categories')

  // Create default tags
  const tags = [
    { name: 'Popular', slug: 'popular', color: '#3b82f6' },
    { name: 'Best Seller', slug: 'best-seller', color: '#10b981' },
    { name: 'New Arrival', slug: 'new-arrival', color: '#f59e0b' },
    { name: 'Limited Time', slug: 'limited-time', color: '#ef4444' },
    { name: 'Premium', slug: 'premium', color: '#8b5cf6' },
    { name: 'Budget Friendly', slug: 'budget-friendly', color: '#06b6d4' },
    { name: 'Trending', slug: 'trending', color: '#f97316' },
    { name: 'Editor\'s Choice', slug: 'editors-choice', color: '#84cc16' }
  ]

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag
    })
  }

  console.log('✅ Created default tags')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })