import { NextRequest, NextResponse } from 'next/server'
import { PluginManager } from '@/lib/plugins/plugin-manager'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plugins = PluginManager.getPlugins()

    return NextResponse.json({
      success: true,
      data: plugins,
    })
  } catch (error) {
    console.error('Error fetching plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { manifest, code } = await request.json()

    const plugin = await PluginManager.installPlugin(manifest, code)

    return NextResponse.json({
      success: true,
      data: plugin,
      message: 'Plugin installed successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error installing plugin:', error)
    return NextResponse.json(
      { error: 'Failed to install plugin' },
      { status: 500 }
    )
  }
}