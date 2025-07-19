import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createPriceAlertSchema = z.object({
  productId: z.string().uuid(),
  targetPrice: z.number().positive()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get price alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select(`
        *,
        products (
          id,
          title,
          current_price,
          currency,
          images
        )
      `)
      .eq('user_profile_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (alertsError) {
      console.error('Failed to get price alerts:', alertsError)
      return NextResponse.json({ error: 'Failed to get price alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Price alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, targetPrice } = createPriceAlertSchema.parse(body)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title, current_price, currency')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if alert already exists
    const { data: existingAlert } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_profile_id', profile.id)
      .eq('product_id', productId)
      .eq('is_active', true)
      .single()

    if (existingAlert) {
      // Update existing alert
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({
          target_price: targetPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAlert.id)

      if (updateError) {
        console.error('Failed to update price alert:', updateError)
        return NextResponse.json({ error: 'Failed to update price alert' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Price alert updated',
        alertId: existingAlert.id
      })
    } else {
      // Create new alert
      const { data: newAlert, error: createError } = await supabase
        .from('price_alerts')
        .insert({
          user_profile_id: profile.id,
          product_id: productId,
          target_price: targetPrice,
          current_price: product.current_price,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create price alert:', createError)
        return NextResponse.json({ error: 'Failed to create price alert' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Price alert created',
        alert: newAlert
      })
    }
  } catch (error) {
    console.error('Create price alert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}