import { z } from 'zod'
import { UserRole, Theme } from '@prisma/client'

// User validation schemas
export const userRoleSchema = z.nativeEnum(UserRole)
export const themeSchema = z.nativeEnum(Theme)

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: userRoleSchema.default(UserRole.ADMIN),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
})

export const userProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  timezone: z.string().default('UTC'),
  theme: themeSchema.default(Theme.SYSTEM),
  language: z.string().min(2, 'Language code must be at least 2 characters').default('en'),
})

export const emailNotificationSettingsSchema = z.object({
  newConversions: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
  systemUpdates: z.boolean().default(true),
})

export const pushNotificationSettingsSchema = z.object({
  realTimeAlerts: z.boolean().default(false),
  dailySummary: z.boolean().default(true),
})

export const createUserWithProfileSchema = z.object({
  user: createUserSchema,
  profile: userProfileSchema.optional(),
  emailNotifications: emailNotificationSettingsSchema.optional(),
  pushNotifications: pushNotificationSettingsSchema.optional(),
})

export const updateUserWithProfileSchema = z.object({
  user: updateUserSchema.optional(),
  profile: userProfileSchema.optional(),
  emailNotifications: emailNotificationSettingsSchema.optional(),
  pushNotifications: pushNotificationSettingsSchema.optional(),
})

// Type inference
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>
export type EmailNotificationSettingsInput = z.infer<typeof emailNotificationSettingsSchema>
export type PushNotificationSettingsInput = z.infer<typeof pushNotificationSettingsSchema>
export type CreateUserWithProfileInput = z.infer<typeof createUserWithProfileSchema>
export type UpdateUserWithProfileInput = z.infer<typeof updateUserWithProfileSchema>