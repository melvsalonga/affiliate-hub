import { NextRequest, NextResponse } from 'next/server'
import { PluginManager } from '@/lib/plugins/plugin-manager'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plugin = PluginManager.getPlugin(params.id)

    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: plugin,
    })
  } catch (error) {
    console.error('Error fetching plugin:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugin' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { config } = await request.json()

    await PluginManager.updatePluginConfig(params.id, config)

    return NextResponse.json({
      success: true,
      message: 'Plugin configuration updated successfully',
    })
  } catch (error) {
    console.error('Error updating plugin:', error)
    return NextResponse.json(
      { error: 'Failed to update plugin' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await PluginManager.uninstallPlugin(params.id)

    return NextResponse.json({
      success: true,
      message: 'Plugin uninstalled successfully',
    })
  } catch (error) {
    console.error('Error uninstalling plugin:', error)
    return NextResponse.json(
      { error: 'Failed to uninstall plugin' },
      { status: 500 }
    )
  }
}