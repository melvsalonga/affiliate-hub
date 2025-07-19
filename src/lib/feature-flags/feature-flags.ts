import { prisma } from '@/lib/prisma'

export interface FeatureFlag {
  id: string
  name: string
  key: string
  description: string
  type: 'boolean' | 'string' | 'number' | 'json'
  value: any
  defaultValue: any
  isActive: boolean
  rolloutPercentage: number
  conditions?: FeatureFlagCondition[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface FeatureFlagCondition {
  type: 'user_role' | 'user_id' | 'user_attribute' | 'date_range' | 'random'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface FeatureFlagContext {
  userId?: string
  userRole?: string
  userAttributes?: Record<string, any>
  timestamp?: Date
  randomValue?: number
}

export class FeatureFlagManager {
  private static flags: Map<string, FeatureFlag> = new Map()
  private static initialized = false

  /**
   * Initialize feature flags
   */
  static async initialize() {
    if (this.initialized) return

    try {
      // In a real implementation, load from database
      const mockFlags = this.getMockFlags()
      
      for (const flag of mockFlags) {
        this.flags.set(flag.key, flag)
      }

      this.initialized = true
      console.log(`Initialized ${this.flags.size} feature flags`)
    } catch (error) {
      console.error('Failed to initialize feature flags:', error)
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  static async isEnabled(flagKey: string, context?: FeatureFlagContext): Promise<boolean> {
    await this.initialize()

    const flag = this.flags.get(flagKey)
    if (!flag || !flag.isActive) {
      return false
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const randomValue = context?.randomValue ?? Math.random()
      if (randomValue * 100 > flag.rolloutPercentage) {
        return false
      }
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      const conditionsMet = await this.evaluateConditions(flag.conditions, context)
      if (!conditionsMet) {
        return false
      }
    }

    // For boolean flags, return the value directly
    if (flag.type === 'boolean') {
      return Boolean(flag.value)
    }

    // For other types, return true if value exists
    return flag.value !== null && flag.value !== undefined
  }

  /**
   * Get feature flag value
   */
  static async getValue<T = any>(flagKey: string, context?: FeatureFlagContext): Promise<T | null> {
    await this.initialize()

    const flag = this.flags.get(flagKey)
    if (!flag || !flag.isActive) {
      return flag?.defaultValue ?? null
    }

    // Check if flag is enabled first
    const isEnabled = await this.isEnabled(flagKey, context)
    if (!isEnabled) {
      return flag.defaultValue ?? null
    }

    return flag.value as T
  }

  /**
   * Get feature flag value with default
   */
  static async getValueWithDefault<T = any>(
    flagKey: string, 
    defaultValue: T, 
    context?: FeatureFlagContext
  ): Promise<T> {
    const value = await this.getValue<T>(flagKey, context)
    return value ?? defaultValue
  }

  /**
   * Evaluate feature flag conditions
   */
  private static async evaluateConditions(
    conditions: FeatureFlagCondition[], 
    context?: FeatureFlagContext
  ): Promise<boolean> {
    if (!context) return false

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context)
      if (!result) {
        return false // All conditions must be true (AND logic)
      }
    }

    return true
  }

  /**
   * Evaluate a single condition
   */
  private static async evaluateCondition(
    condition: FeatureFlagCondition, 
    context: FeatureFlagContext
  ): Promise<boolean> {
    let contextValue: any

    switch (condition.type) {
      case 'user_role':
        contextValue = context.userRole
        break
      case 'user_id':
        contextValue = context.userId
        break
      case 'user_attribute':
        contextValue = context.userAttributes
        break
      case 'date_range':
        contextValue = context.timestamp || new Date()
        break
      case 'random':
        contextValue = context.randomValue ?? Math.random()
        break
      default:
        return false
    }

    return this.evaluateOperator(contextValue, condition.operator, condition.value)
  }

  /**
   * Evaluate operator
   */
  private static evaluateOperator(contextValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return contextValue === conditionValue
      case 'not_equals':
        return contextValue !== conditionValue
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(contextValue)
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(contextValue)
      case 'greater_than':
        return contextValue > conditionValue
      case 'less_than':
        return contextValue < conditionValue
      case 'contains':
        return String(contextValue).includes(String(conditionValue))
      default:
        return false
    }
  }

  /**
   * Create a new feature flag
   */
  static async createFlag(flagData: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const flag: FeatureFlag = {
      id: crypto.randomUUID(),
      ...flagData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.flags.set(flag.key, flag)

    // In a real implementation, save to database
    console.log('Created feature flag:', flag)

    return flag
  }

  /**
   * Update a feature flag
   */
  static async updateFlag(flagKey: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      throw new Error('Feature flag not found')
    }

    const updatedFlag = {
      ...flag,
      ...updates,
      updatedAt: new Date(),
    }

    this.flags.set(flagKey, updatedFlag)

    // In a real implementation, update database
    console.log('Updated feature flag:', updatedFlag)

    return updatedFlag
  }

  /**
   * Delete a feature flag
   */
  static async deleteFlag(flagKey: string): Promise<void> {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      throw new Error('Feature flag not found')
    }

    this.flags.delete(flagKey)

    // In a real implementation, delete from database
    console.log('Deleted feature flag:', flag.key)
  }

  /**
   * Get all feature flags
   */
  static async getAllFlags(): Promise<FeatureFlag[]> {
    await this.initialize()
    return Array.from(this.flags.values())
  }

  /**
   * Get feature flag by key
   */
  static async getFlag(flagKey: string): Promise<FeatureFlag | null> {
    await this.initialize()
    return this.flags.get(flagKey) || null
  }

  /**
   * Toggle feature flag
   */
  static async toggleFlag(flagKey: string): Promise<FeatureFlag> {
    const flag = this.flags.get(flagKey)
    if (!flag) {
      throw new Error('Feature flag not found')
    }

    return await this.updateFlag(flagKey, { isActive: !flag.isActive })
  }

  /**
   * Get flags for user context
   */
  static async getFlagsForUser(context: FeatureFlagContext): Promise<Record<string, any>> {
    await this.initialize()

    const result: Record<string, any> = {}

    for (const [key, flag] of this.flags.entries()) {
      if (flag.isActive) {
        const isEnabled = await this.isEnabled(key, context)
        if (isEnabled) {
          result[key] = flag.value
        } else {
          result[key] = flag.defaultValue
        }
      } else {
        result[key] = flag.defaultValue
      }
    }

    return result
  }

  /**
   * Mock feature flags for demonstration
   */
  private static getMockFlags(): FeatureFlag[] {
    return [
      {
        id: '1',
        name: 'Advanced Analytics Dashboard',
        key: 'advanced_analytics',
        description: 'Enable advanced analytics dashboard with AI insights',
        type: 'boolean',
        value: true,
        defaultValue: false,
        isActive: true,
        rolloutPercentage: 50,
        conditions: [
          {
            type: 'user_role',
            operator: 'in',
            value: ['ADMIN', 'EDITOR'],
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        createdBy: 'admin',
      },
      {
        id: '2',
        name: 'Social Media Auto-Posting',
        key: 'social_auto_post',
        description: 'Automatically post new products to social media',
        type: 'boolean',
        value: false,
        defaultValue: false,
        isActive: true,
        rolloutPercentage: 25,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-20'),
        createdBy: 'admin',
      },
      {
        id: '3',
        name: 'Email Campaign Frequency',
        key: 'email_frequency',
        description: 'Maximum number of emails per week',
        type: 'number',
        value: 3,
        defaultValue: 2,
        isActive: true,
        rolloutPercentage: 100,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        createdBy: 'admin',
      },
      {
        id: '4',
        name: 'Beta Features',
        key: 'beta_features',
        description: 'Enable beta features for testing',
        type: 'json',
        value: {
          aiRecommendations: true,
          voiceSearch: false,
          darkMode: true,
        },
        defaultValue: {},
        isActive: true,
        rolloutPercentage: 10,
        conditions: [
          {
            type: 'user_role',
            operator: 'equals',
            value: 'ADMIN',
          },
        ],
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-22'),
        createdBy: 'admin',
      },
      {
        id: '5',
        name: 'Maintenance Mode',
        key: 'maintenance_mode',
        description: 'Enable maintenance mode for the application',
        type: 'boolean',
        value: false,
        defaultValue: false,
        isActive: false,
        rolloutPercentage: 0,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-16'),
        createdBy: 'admin',
      },
    ]
  }
}