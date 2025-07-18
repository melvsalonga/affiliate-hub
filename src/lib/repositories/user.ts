import { prisma } from '../prisma'
import { 
  User, 
  UserWithProfile, 
  UserProfile,
  EmailNotificationSettings,
  PushNotificationSettings,
  UserWhereInput,
  CreateUserInput,
  UpdateUserInput
} from '../../types/database'
import { 
  CreateUserWithProfileInput,
  UpdateUserWithProfileInput
} from '../validations/user'
import { BaseRepository, NotFoundError, ConflictError, PaginatedResult, paginate } from './base'

export class UserRepository implements BaseRepository<User, CreateUserInput, UpdateUserInput, UserWhereInput> {
  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  async findWithProfile(id: string): Promise<UserWithProfile | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            emailNotifications: true,
            pushNotifications: true
          }
        }
      }
    })
  }

  async findMany(where?: UserWhereInput, page: number = 1, limit: number = 20): Promise<PaginatedResult<User>> {
    const query = prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    
    return await paginate<User>(query, page, limit)
  }

  async create(data: CreateUserInput): Promise<User> {
    try {
      return await prisma.user.create({
        data
      })
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictError('User with this email already exists')
      }
      throw error
    }
  }

  async createWithProfile(data: CreateUserWithProfileInput): Promise<UserWithProfile> {
    try {
      return await prisma.user.create({
        data: {
          ...data.user,
          profile: data.profile ? {
            create: {
              ...data.profile,
              emailNotifications: data.emailNotifications ? {
                create: data.emailNotifications
              } : undefined,
              pushNotifications: data.pushNotifications ? {
                create: data.pushNotifications
              } : undefined
            }
          } : undefined
        },
        include: {
          profile: {
            include: {
              emailNotifications: true,
              pushNotifications: true
            }
          }
        }
      })
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictError('User with this email already exists')
      }
      throw error
    }
  }

  async update(id: string, data: UpdateUserInput): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User', id)
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictError('User with this email already exists')
      }
      throw error
    }
  }

  async updateWithProfile(id: string, data: UpdateUserWithProfileInput): Promise<UserWithProfile> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...data.user,
          profile: data.profile ? {
            upsert: {
              create: {
                ...data.profile,
                emailNotifications: data.emailNotifications ? {
                  create: data.emailNotifications
                } : undefined,
                pushNotifications: data.pushNotifications ? {
                  create: data.pushNotifications
                } : undefined
              },
              update: {
                ...data.profile,
                emailNotifications: data.emailNotifications ? {
                  upsert: {
                    create: data.emailNotifications,
                    update: data.emailNotifications
                  }
                } : undefined,
                pushNotifications: data.pushNotifications ? {
                  upsert: {
                    create: data.pushNotifications,
                    update: data.pushNotifications
                  }
                } : undefined
              }
            }
          } : undefined
        },
        include: {
          profile: {
            include: {
              emailNotifications: true,
              pushNotifications: true
            }
          }
        }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User', id)
      }
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictError('User with this email already exists')
      }
      throw error
    }
  }

  async delete(id: string): Promise<User> {
    try {
      return await prisma.user.delete({
        where: { id }
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User', id)
      }
      throw error
    }
  }

  async count(where?: UserWhereInput): Promise<number> {
    return await prisma.user.count({ where })
  }

  async updateLastLogin(id: string): Promise<User> {
    return await this.update(id, {
      lastLoginAt: new Date()
    })
  }

  async findActiveAdmins(): Promise<User[]> {
    return await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findByRole(role: 'ADMIN' | 'EDITOR' | 'VIEWER'): Promise<User[]> {
    return await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' }
    })
  }
}

export const userRepository = new UserRepository()