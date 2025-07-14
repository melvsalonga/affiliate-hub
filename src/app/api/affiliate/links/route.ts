import { NextRequest, NextResponse } from 'next/server';
import { affiliateService } from '@/services/affiliateService';
import { LinkGenerationRequest } from '@/types/affiliate';

// GET /api/affiliate/links - Get all affiliate links
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const isActive = searchParams.get('isActive');
    const tags = searchParams.get('tags');

    const filter: any = {};
    if (platform) filter.platform = platform;
    if (isActive !== null) filter.isActive = isActive === 'true';
    if (tags) filter.tags = tags.split(',');

    const links = affiliateService.getAllAffiliateLinks(filter);

    return NextResponse.json({
      success: true,
      data: links
    });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch affiliate links'
    }, { status: 500 });
  }
}

// POST /api/affiliate/links - Create new affiliate link
export async function POST(request: NextRequest) {
  try {
    const body: LinkGenerationRequest = await request.json();

    // Validate required fields
    if (!body.originalUrl || !body.platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: originalUrl and platform'
      }, { status: 400 });
    }

    const result = await affiliateService.generateAffiliateLink(body);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.affiliateLink
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create affiliate link'
    }, { status: 500 });
  }
}

// PUT /api/affiliate/links - Update affiliate link
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: id'
      }, { status: 400 });
    }

    const result = await affiliateService.updateAffiliateLink(id, updates);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.affiliateLink
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating affiliate link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update affiliate link'
    }, { status: 500 });
  }
}

// DELETE /api/affiliate/links - Delete affiliate link
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: id'
      }, { status: 400 });
    }

    const result = await affiliateService.deleteAffiliateLink(id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Affiliate link deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete affiliate link'
    }, { status: 500 });
  }
}
