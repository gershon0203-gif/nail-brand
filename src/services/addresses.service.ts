import { isDemoMode, supabase } from '@/lib/supabase';
import type { Address, AddressInput } from '@/types';

export async function listAddresses(userId: string): Promise<Address[]> {
  if (isDemoMode) return [];
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Address[];
}

export async function getAddress(id: string): Promise<Address | null> {
  if (isDemoMode) return null;
  const { data, error } = await supabase.from('addresses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Address) || null;
}

export async function saveAddress(userId: string, input: AddressInput, id?: string): Promise<Address> {
  if (isDemoMode) throw new Error('Address management requires a connected Supabase backend.');
  const payload = { ...input, user_id: userId };
  if (id) {
    const { data, error } = await supabase.from('addresses').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Address;
  }
  const { data, error } = await supabase.from('addresses').insert(payload).select().single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string): Promise<void> {
  if (isDemoMode) throw new Error('Address management requires a connected Supabase backend.');
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  if (isDemoMode) throw new Error('Address management requires a connected Supabase backend.');
  const { error } = await supabase.rpc('set_default_address', {
    p_user_id: userId,
    p_address_id: addressId,
  });
  if (error) throw error;
}

export const emptyAddress: AddressInput = {
  label: 'Home',
  full_name: '',
  phone: '',
  house_flat: '',
  street: '',
  area: '',
  city: '',
  state: '',
  pin_code: '',
  landmark: '',
  is_default: false,
};
