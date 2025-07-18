import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, authenticateRequest, checkUserPermissions } from '@/lib/api/utils';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'No images provided'
      }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Cannot upload more than 10 images at once'
      }, { status: 400 });
    }

    const supabase = createClient();
    const uploadResults = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push({
          index: i,
          filename: file.name,
          error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        });
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          index: i,
          filename: file.name,
          error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        });
        continue;
      }

      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          errors.push({
            index: i,
            filename: file.name,
            error: uploadError.message
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadResults.push({
          index: i,
          filename: file.name,
          url: publicUrl,
          path: filePath,
          size: file.size,
          type: file.type
        });

      } catch (error) {
        errors.push({
          index: i,
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        uploaded: uploadResults.length,
        failed: errors.length,
        images: uploadResults,
        errors
      },
      message: `Image upload completed: ${uploadResults.length} uploaded, ${errors.length} failed`
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { authenticated, user, error: authError } = await authenticateRequest();
    
    if (!authenticated || !user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { hasPermission } = await checkUserPermissions(user.id);
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'Image path is required'
      }, { status: 400 });
    }

    const supabase = createClient();

    const { error: deleteError } = await supabase.storage
      .from('images')
      .remove([imagePath]);

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: 'Delete Failed',
        message: deleteError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    return handleApiError(error);
  }
}