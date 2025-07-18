'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function MFASetup() {
  const { user } = useAuthContext()
  const [isEnabling, setIsEnabling] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mfaEnabled, setMfaEnabled] = useState(false) // This would come from user data

  const handleEnableMFA = async () => {
    setIsEnabling(true)
    setError('')
    
    try {
      // In a real implementation, this would call Supabase MFA API
      // For now, we'll simulate the process
      
      // Generate QR code and secret (this would be done by Supabase)
      const mockSecret = 'JBSWY3DPEHPK3PXP'
      const mockQrCode = `otpauth://totp/LinkVault%20Pro:${user?.email}?secret=${mockSecret}&issuer=LinkVault%20Pro`
      
      setSecret(mockSecret)
      setQrCode(mockQrCode)
      setIsEnabling(false)
    } catch (error) {
      setError('Failed to enable MFA')
      setIsEnabling(false)
    }
  }

  const handleVerifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    try {
      // In a real implementation, this would verify the TOTP code with Supabase
      // For demo purposes, we'll accept any 6-digit code
      setMfaEnabled(true)
      setSuccess('Multi-factor authentication has been enabled successfully!')
      setQrCode('')
      setSecret('')
      setVerificationCode('')
    } catch (error) {
      setError('Invalid verification code')
    }
  }

  const handleDisableMFA = async () => {
    setIsDisabling(true)
    setError('')
    
    try {
      // In a real implementation, this would disable MFA via Supabase
      setMfaEnabled(false)
      setSuccess('Multi-factor authentication has been disabled')
      setIsDisabling(false)
    } catch (error) {
      setError('Failed to disable MFA')
      setIsDisabling(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Multi-Factor Authentication</h2>
        <p className="text-gray-600 mt-1">
          Add an extra layer of security to your account with TOTP-based authentication.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {!mfaEnabled && !qrCode && (
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">MFA Not Enabled</h3>
          <p className="text-gray-600 mb-6">
            Secure your account with time-based one-time passwords (TOTP) using apps like Google Authenticator or Authy.
          </p>
          <Button onClick={handleEnableMFA} disabled={isEnabling}>
            {isEnabling ? 'Setting up...' : 'Enable MFA'}
          </Button>
        </div>
      )}

      {qrCode && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Your Authenticator App</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">
                1. Install an authenticator app like Google Authenticator, Authy, or 1Password
              </p>
              <p className="text-sm text-gray-600 mb-4">
                2. Scan this QR code with your authenticator app:
              </p>
              
              {/* QR Code placeholder - in real implementation, generate actual QR code */}
              <div className="bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg text-center mb-4">
                <div className="w-48 h-48 mx-auto bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">QR Code would appear here</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                3. Or manually enter this secret key:
              </p>
              <div className="bg-white p-2 border rounded font-mono text-sm break-all">
                {secret}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your authenticator app:
            </label>
            <div className="flex space-x-3">
              <Input
                id="verificationCode"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="flex-1"
                maxLength={6}
              />
              <Button onClick={handleVerifyAndEnable}>
                Verify & Enable
              </Button>
            </div>
          </div>
        </div>
      )}

      {mfaEnabled && (
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">MFA Enabled</h3>
          <p className="text-gray-600 mb-6">
            Your account is protected with multi-factor authentication. You'll need to enter a code from your authenticator app when signing in.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              View Backup Codes
            </Button>
            <Button 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700"
              onClick={handleDisableMFA}
              disabled={isDisabling}
            >
              {isDisabling ? 'Disabling...' : 'Disable MFA'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}