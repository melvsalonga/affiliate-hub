import { createCipher, createDecipher, createHash, randomBytes, pbkdf2Sync, scryptSync } from 'crypto'

// Encryption configuration
export interface EncryptionConfig {
  algorithm: string
  keyLength: number
  ivLength: number
  saltLength: number
  iterations: number
  tagLength?: number
}

// Default encryption configurations
export const ENCRYPTION_CONFIGS = {
  AES_256_GCM: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    iterations: 100000,
    tagLength: 16
  },
  AES_256_CBC: {
    algorithm: 'aes-256-cbc',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    iterations: 100000
  },
  CHACHA20_POLY1305: {
    algorithm: 'chacha20-poly1305',
    keyLength: 32,
    ivLength: 12,
    saltLength: 32,
    iterations: 100000,
    tagLength: 16
  }
} as const

// Encrypted data structure
export interface EncryptedData {
  data: string // Base64 encoded encrypted data
  iv: string // Base64 encoded initialization vector
  salt: string // Base64 encoded salt
  tag?: string // Base64 encoded authentication tag (for AEAD modes)
  algorithm: string
  iterations: number
}

// Encryption service
export class EncryptionService {
  private config: EncryptionConfig
  private masterKey: Buffer

  constructor(
    masterKey: string | Buffer,
    config: EncryptionConfig = ENCRYPTION_CONFIGS.AES_256_GCM
  ) {
    this.config = config
    this.masterKey = typeof masterKey === 'string' ? Buffer.from(masterKey, 'utf8') : masterKey
  }

  /**
   * Encrypt data with password-based key derivation
   */
  encrypt(data: string, password?: string): EncryptedData {
    try {
      const salt = randomBytes(this.config.saltLength)
      const iv = randomBytes(this.config.ivLength)
      
      // Derive key from master key and optional password
      const key = this.deriveKey(password, salt)
      
      // Create cipher
      const cipher = createCipher(this.config.algorithm, key)
      cipher.setAAD(Buffer.from('LinkVault-Pro-AAD')) // Additional authenticated data
      
      // Encrypt data
      let encrypted = cipher.update(data, 'utf8', 'base64')
      encrypted += cipher.final('base64')
      
      const result: EncryptedData = {
        data: encrypted,
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        algorithm: this.config.algorithm,
        iterations: this.config.iterations
      }
      
      // Add authentication tag for AEAD modes
      if (this.config.tagLength && 'getAuthTag' in cipher) {
        result.tag = (cipher as any).getAuthTag().toString('base64')
      }
      
      return result
    } catch (error) {
      throw new EncryptionError('Encryption failed', error)
    }
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData: EncryptedData, password?: string): string {
    try {
      const salt = Buffer.from(encryptedData.salt, 'base64')
      const iv = Buffer.from(encryptedData.iv, 'base64')
      
      // Derive key
      const key = this.deriveKey(password, salt)
      
      // Create decipher
      const decipher = createDecipher(encryptedData.algorithm, key)
      decipher.setAAD(Buffer.from('LinkVault-Pro-AAD'))
      
      // Set authentication tag for AEAD modes
      if (encryptedData.tag && 'setAuthTag' in decipher) {
        const tag = Buffer.from(encryptedData.tag, 'base64')
        ;(decipher as any).setAuthTag(tag)
      }
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new EncryptionError('Decryption failed', error)
    }
  }

  /**
   * Encrypt object (serializes to JSON first)
   */
  encryptObject(obj: any, password?: string): EncryptedData {
    const jsonString = JSON.stringify(obj)
    return this.encrypt(jsonString, password)
  }

  /**
   * Decrypt object (deserializes from JSON)
   */
  decryptObject<T = any>(encryptedData: EncryptedData, password?: string): T {
    const jsonString = this.decrypt(encryptedData, password)
    return JSON.parse(jsonString)
  }

  /**
   * Derive encryption key from master key and optional password
   */
  private deriveKey(password?: string, salt?: Buffer): Buffer {
    const input = password 
      ? Buffer.concat([this.masterKey, Buffer.from(password, 'utf8')])
      : this.masterKey
    
    if (salt) {
      return scryptSync(input, salt, this.config.keyLength)
    } else {
      return createHash('sha256').update(input).digest().slice(0, this.config.keyLength)
    }
  }
}

// Field-level encryption for database
export class FieldEncryption {
  private encryptionService: EncryptionService

  constructor(masterKey: string | Buffer) {
    this.encryptionService = new EncryptionService(masterKey)
  }

  /**
   * Encrypt sensitive fields in an object
   */
  encryptFields(obj: Record<string, any>, fieldsToEncrypt: string[]): Record<string, any> {
    const result = { ...obj }
    
    for (const field of fieldsToEncrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        const value = typeof result[field] === 'string' 
          ? result[field] 
          : JSON.stringify(result[field])
        
        result[field] = this.encryptionService.encrypt(value)
      }
    }
    
    return result
  }

  /**
   * Decrypt sensitive fields in an object
   */
  decryptFields(obj: Record<string, any>, fieldsToDecrypt: string[]): Record<string, any> {
    const result = { ...obj }
    
    for (const field of fieldsToDecrypt) {
      if (result[field] && typeof result[field] === 'object' && result[field].data) {
        try {
          const decrypted = this.encryptionService.decrypt(result[field])
          
          // Try to parse as JSON, fallback to string
          try {
            result[field] = JSON.parse(decrypted)
          } catch {
            result[field] = decrypted
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error)
          // Leave field as is if decryption fails
        }
      }
    }
    
    return result
  }
}

// Token encryption for secure tokens
export class TokenEncryption {
  private static readonly TOKEN_SEPARATOR = '.'
  private encryptionService: EncryptionService

  constructor(secretKey: string) {
    this.encryptionService = new EncryptionService(secretKey)
  }

  /**
   * Create encrypted token with expiration
   */
  createToken(payload: any, expiresInMs: number = 24 * 60 * 60 * 1000): string {
    const tokenData = {
      payload,
      expires: Date.now() + expiresInMs,
      issued: Date.now()
    }
    
    const encrypted = this.encryptionService.encryptObject(tokenData)
    
    // Create token string: algorithm.data.iv.salt.tag
    const parts = [
      encrypted.algorithm,
      encrypted.data,
      encrypted.iv,
      encrypted.salt
    ]
    
    if (encrypted.tag) {
      parts.push(encrypted.tag)
    }
    
    return parts.join(TokenEncryption.TOKEN_SEPARATOR)
  }

  /**
   * Verify and decrypt token
   */
  verifyToken<T = any>(token: string): { payload: T; issued: number; expires: number } | null {
    try {
      const parts = token.split(TokenEncryption.TOKEN_SEPARATOR)
      
      if (parts.length < 4) {
        return null
      }
      
      const encryptedData: EncryptedData = {
        algorithm: parts[0],
        data: parts[1],
        iv: parts[2],
        salt: parts[3],
        tag: parts[4] || undefined,
        iterations: this.encryptionService['config'].iterations
      }
      
      const tokenData = this.encryptionService.decryptObject(encryptedData)
      
      // Check expiration
      if (Date.now() > tokenData.expires) {
        return null
      }
      
      return {
        payload: tokenData.payload,
        issued: tokenData.issued,
        expires: tokenData.expires
      }
    } catch {
      return null
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const verified = this.verifyToken(token)
    return verified === null
  }
}

// Password hashing utilities
export class PasswordSecurity {
  private static readonly SALT_ROUNDS = 12
  private static readonly PEPPER = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production'

  /**
   * Hash password with salt and pepper
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const bcrypt = await import('bcryptjs')
      
      // Add pepper to password
      const pepperedPassword = password + PasswordSecurity.PEPPER
      
      // Hash with bcrypt
      const hash = await bcrypt.hash(pepperedPassword, PasswordSecurity.SALT_ROUNDS)
      
      return hash
    } catch (error) {
      throw new EncryptionError('Password hashing failed', error)
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const bcrypt = await import('bcryptjs')
      
      // Add pepper to password
      const pepperedPassword = password + PasswordSecurity.PEPPER
      
      // Verify with bcrypt
      return await bcrypt.compare(pepperedPassword, hash)
    } catch (error) {
      throw new EncryptionError('Password verification failed', error)
    }
  }

  /**
   * Generate secure random password
   */
  static generatePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      password += charset[randomIndex]
    }
    
    return password
  }

  /**
   * Check password strength
   */
  static checkPasswordStrength(password: string): {
    score: number // 0-4
    feedback: string[]
    isStrong: boolean
  } {
    const feedback: string[] = []
    let score = 0

    // Length check
    if (password.length >= 8) score++
    else feedback.push('Password should be at least 8 characters long')

    if (password.length >= 12) score++
    else if (password.length >= 8) feedback.push('Consider using a longer password (12+ characters)')

    // Character variety checks
    if (/[a-z]/.test(password)) score++
    else feedback.push('Add lowercase letters')

    if (/[A-Z]/.test(password)) score++
    else feedback.push('Add uppercase letters')

    if (/\d/.test(password)) score++
    else feedback.push('Add numbers')

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    else feedback.push('Add special characters')

    // Common patterns check
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeating characters')
      score = Math.max(0, score - 1)
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      feedback.push('Avoid common patterns and words')
      score = Math.max(0, score - 1)
    }

    return {
      score: Math.min(4, score),
      feedback,
      isStrong: score >= 3
    }
  }
}

// Secure random utilities
export class SecureRandom {
  /**
   * Generate cryptographically secure random bytes
   */
  static generateBytes(length: number): Buffer {
    return randomBytes(length)
  }

  /**
   * Generate secure random string
   */
  static generateString(length: number, charset?: string): string {
    const defaultCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const chars = charset || defaultCharset
    
    const bytes = randomBytes(length)
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    
    return result
  }

  /**
   * Generate secure random integer
   */
  static generateInt(min: number, max: number): number {
    const range = max - min + 1
    const bytes = randomBytes(4)
    const value = bytes.readUInt32BE(0)
    
    return min + (value % range)
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    const bytes = randomBytes(16)
    
    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    
    const hex = bytes.toString('hex')
    
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-')
  }
}

// Custom encryption error
export class EncryptionError extends Error {
  constructor(message: string, public cause?: any) {
    super(message)
    this.name = 'EncryptionError'
  }
}

// Export configured instances
const masterKey = process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production'

export const encryptionService = new EncryptionService(masterKey)
export const fieldEncryption = new FieldEncryption(masterKey)
export const tokenEncryption = new TokenEncryption(process.env.TOKEN_SECRET || 'default-token-secret')

// Utility functions
export function encryptSensitiveData(data: string, password?: string): EncryptedData {
  return encryptionService.encrypt(data, password)
}

export function decryptSensitiveData(encryptedData: EncryptedData, password?: string): string {
  return encryptionService.decrypt(encryptedData, password)
}

export function createSecureToken(payload: any, expiresInMs?: number): string {
  return tokenEncryption.createToken(payload, expiresInMs)
}

export function verifySecureToken<T = any>(token: string): { payload: T; issued: number; expires: number } | null {
  return tokenEncryption.verifyToken<T>(token)
}

export async function hashPassword(password: string): Promise<string> {
  return PasswordSecurity.hashPassword(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return PasswordSecurity.verifyPassword(password, hash)
}