import type { User } from '@supabase/supabase-js';

export type StaffRole = 'user' | 'admin';

export interface StaffProfile {
  user_id: string;
  email: string | null;
  staff_name: string | null;
  staff_avatar_url: string | null;
  role: StaffRole;
  created_at: string;
  updated_at: string;
}

export function getStaffName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return String(
    metadata?.full_name
    ?? metadata?.name
    ?? metadata?.global_name
    ?? metadata?.user_name
    ?? metadata?.preferred_username
    ?? user.email
    ?? 'Staff'
  );
}

export function getStaffAvatarUrl(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.avatar_url ?? metadata?.picture ?? metadata?.avatar;
  return typeof value === 'string' && value.length > 0 ? value : null;
}
