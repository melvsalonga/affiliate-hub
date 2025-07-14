import { NextRequest, NextResponse } from 'next/server';
import { affiliateService } from '@/services/affiliateService';

// GET /api/affiliate/analytics - Get analytics for affiliate links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: linkId'
      }, { status: 400 });
    }

    const analytics = affiliateService.getLinkAnalytics(linkId);

    if (!analytics) {
      return NextResponse.json({
        success: false,
        error: 'Affiliate link not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching affiliate link analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics'
    }, { status: 500 });
  }
}

// POST /api/affiliate/analytics - Track click or conversion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, linkId, ...data } = body;

    if (!type || !linkId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: type and linkId'
      }, { status: 400 });
    }

    if (type === 'click') {
      await affiliateService.trackClick(linkId, data);
    } else if (type === 'conversion') {
      await affiliateService.trackConversion(linkId, data);
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid type. Must be "click" or "conversion"'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${type} tracked successfully`
    });
  } catch (error) {
    console.error('Error tracking affiliate event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track event'
    }, { status: 500 });
  }
}
