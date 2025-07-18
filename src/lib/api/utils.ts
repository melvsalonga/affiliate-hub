import { NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { RepositoryError, NotFoundError, ConflictError } from '@/lib/repositories/base';

export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: any;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

export async function validateRequest<T>(schema: ZodSchema<T>, data: any): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid request data', error.errors);
    }
    throw error;
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ValidationError) {
    return NextResponse.json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: error.details
    }, { status: 400 });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({
      success: false,
      error: 'Not Found',
      message: error.message
    }, { status: 404 });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({
      success: false,
      error: 'Conflict',
      message: error.message
    }, { status: 409 });
  }

  if (error instanceof RepositoryError) {
    return NextResponse.json({
      success: false,
      error: 'Database Error',
      message: error.message
    }, { status: 500 });
  }

  // Generic error handling
  return NextResponse.json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  }, { status: 500 });
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: any[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  }, { status });
}

export function createErrorResponse(
  error: string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error,
    message,
    details
  }, { status });
}

// Helper to extract pagination params
export function extractPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  
  return { page, limit };
}

// Helper to extract sort params
export function extractSortParams(searchParams: URLSearchParams, defaultField = 'createdAt') {
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  
  return {
    field: sortBy,
    direction: sortOrder
  };
}

// Helper to check user permissions
export async function checkUserPermissions(
  userId: string,
  requiredRoles: string[] = ['ADMIN', 'EDITOR']
): Promise<{ hasPermission: boolean; userRole?: string }> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    
    const { data: userData } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', userId)
      .single();

    if (!userData || !userData.is_active) {
      return { hasPermission: false };
    }

    const hasPermission = requiredRoles.includes(userData.role);
    return { hasPermission, userRole: userData.role };
  } catch (error) {
    console.error('Permission check error:', error);
    return { hasPermission: false };
  }
}

// Helper to authenticate requests
export async function authenticateRequest(): Promise<{
  authenticated: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, error: 'Unauthorized' };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}