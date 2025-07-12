import { NextRequest, NextResponse } from 'next/server';
import { PlatformService } from '@/services/platformService';

export async function GET(request: NextRequest) {
  try {
    const platformService = PlatformService.getInstance();
    const activePlatforms = platformService.getActivePlatforms();
    const healthChecks = await platformService.healthCheck();

    const platformStatus = activePlatforms.map(platform => ({
      id: platform.id,
      name: platform.displayName,
      isActive: platform.isActive,
      isHealthy: healthChecks[platform.id] || false,
      commission: platform.commission,
      currency: platform.currency,
      rateLimit: platform.rateLimit,
      baseUrl: platform.baseUrl
    }));

    const summary = {
      totalPlatforms: activePlatforms.length,
      healthyPlatforms: Object.values(healthChecks).filter(status => status).length,
      avgCommission: activePlatforms.reduce((sum, p) => sum + p.commission, 0) / activePlatforms.length,
      supportedCurrencies: [...new Set(activePlatforms.map(p => p.currency))],
      lastChecked: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        platforms: platformStatus,
        summary
      }
    });

  } catch (error) {
    console.error('Platform status API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch platform status'
    }, { status: 500 });
  }
}
