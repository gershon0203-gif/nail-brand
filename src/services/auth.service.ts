import { isDemoMode, supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

function assertBackend(action: string): void {
  if (isDemoMode) {
    throw new Error(`${action} requires a connected Supabase backend. Add your credentials to .env and restart the dev server.`);
  }
}

export async function signUp({ email, password, fullName, phone }: SignUpInput) {
  assertBackend('Registration');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim(), phone: phone?.trim() || '' } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  assertBackend('Sign in');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut(): Promise<void> {
  if (isDemoMode) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email: string): Promise<void> {
  assertBackend('Password reset');
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updateUserPassword(password: string): Promise<void> {
  assertBackend('Password update');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isDemoMode) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as Profile) || null;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  assertBackend('Profile update');
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export function isAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'admin' || profile?.role === 'super_admin';
}

export function isSuperAdmin(profile: Profile | null | undefined): boolean {
  return profile?.role === 'super_admin';
}
