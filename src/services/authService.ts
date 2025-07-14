import { supabase } from '@/utils/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AdminUser;
  session?: Session;
  error?: string;
}

class AuthService {
  // Sign in admin user
  async signIn(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user || !data.session) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if user is an admin
      const adminUser = await this.getAdminUser(data.user.id);
      if (!adminUser) {
        // Sign out the user since they're not an admin
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Access denied. Admin privileges required.'
        };
      }

      // Update last login time
      await this.updateLastLogin(adminUser.id);

      return {
        success: true,
        user: adminUser,
        session: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Sign out current user
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get admin user details
  async getAdminUser(userId: string): Promise<AdminUser | null> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined
      };
    } catch (error) {
      console.error('Error getting admin user:', error);
      return null;
    }
  }

  // Check if current user is admin
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const adminUser = await this.getAdminUser(user.id);
      return adminUser !== null;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Update last login time
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // Create admin user (for initial setup)
  async createAdminUser(email: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<LoginResponse> {
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return {
          success: false,
          error: authError.message
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Failed to create user'
        };
      }

      // Then create the admin user record
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .insert([{
          id: authData.user.id,
          email: authData.user.email,
          role,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (adminError) {
        // Clean up auth user if admin creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: 'Failed to create admin user record'
        };
      }

      const adminUser: AdminUser = {
        id: adminData.id,
        email: adminData.email,
        role: adminData.role,
        isActive: adminData.is_active,
        createdAt: new Date(adminData.created_at)
      };

      return {
        success: true,
        user: adminUser
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session);
    });
  }
}

export const authService = new AuthService();
export default authService;
