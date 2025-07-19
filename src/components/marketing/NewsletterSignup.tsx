'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface NewsletterSignupProps {
  variant?: 'default' | 'compact' | 'inline'
  title?: string
  description?: string
  placeholder?: string
  buttonText?: string
  className?: string
}

export function NewsletterSignup({
  variant = 'default',
  title = 'Stay Updated with the Best Deals',
  description = 'Get notified about price drops, exclusive deals, and new products before anyone else.',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe',
  className = '',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/email-marketing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          source: 'newsletter_signup',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setEmail('')
        setFirstName('')
        
        // Track subscription event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'newsletter_signup', {
            event_category: 'engagement',
            event_label: 'newsletter',
          })
        }
      } else {
        setError(data.message || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className={`p-6 text-center bg-green-50 border-green-200 ${className}`}>
        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Successfully Subscribed!
        </h3>
        <p className="text-green-700">
          Thank you for subscribing! You'll receive the best deals and updates in your inbox.
        </p>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            error={error}
          />
          <Button
            type="submit"
            loading={loading}
            className="whitespace-nowrap"
          >
            {buttonText}
          </Button>
        </form>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-lg text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-blue-100 text-sm">{description}</p>
          </div>
          <form onSubmit={handleSubmit} className="flex space-x-2 ml-6">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="w-64 bg-white text-gray-900"
              error={error}
            />
            <Button
              type="submit"
              loading={loading}
              variant="outline"
              className="bg-white text-blue-600 hover:bg-gray-50 whitespace-nowrap"
            >
              {buttonText}
            </Button>
          </form>
        </div>
        {error && (
          <p className="text-red-200 text-sm mt-2">{error}</p>
        )}
      </div>
    )
  }

  return (
    <Card className={`p-8 text-center ${className}`}>
      <EnvelopeIcon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name (optional)"
          />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
          />
        </div>
        
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          {buttonText}
        </Button>
      </form>
      
      <p className="text-xs text-gray-500 mt-4">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </Card>
  )
}