import { NextRequest, NextResponse } from 'next/server'
import { PluginManager } from '@/lib/plugins/plugin-manager'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
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

    if (plugin.status === 'active') {
      await PluginManager.deactivatePlugin(params.id)
    } else {
      await PluginManager.activatePlugin(params.id)
    }

    return NextResponse.json({
      success: true,
      message: `Plugin ${plugin.status === 'active' ? 'deactivated' : 'activated'} successfully`,
    })
  } catch (error) {
    console.error('Error toggling plugin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle plugin' },
      { status: 500 }
    )
  }
}