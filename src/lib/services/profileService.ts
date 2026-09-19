import { supabase, isSupabaseConfigured } from '../supabase';
import type { UserProfile } from './authService';

export interface EmergencyProfile {
  user_id: string;
  emergency_contact: string;
  blood_group: string;
  medical_notes: string;
  allergies: string;
  special_assistance: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) return data as UserProfile;
    }
    return null;
  },

  async ensureProfile(
    userId: string,
    email: string,
    fullName: string,
    _roleRequested?: UserProfile['role']
  ): Promise<UserProfile> {
    if (!isSupabaseConfigured() || !userId || userId === 'local-user-id') {
      return {
        id: userId || 'local-user-id',
        full_name: fullName,
        email,
        role: 'student',
      };
    }

    // 1. Check if profile already exists (e.g. created automatically by DB trigger)
    const existing = await this.getProfile(userId);
    if (existing) {
      return existing;
    }

    // 2. If not found, create row in public.profiles using authenticated user ID
    const newProfileData = {
      id: userId,
      full_name: fullName,
      email: email,
      role: 'student' as const, // Always default to student per requirements
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(newProfileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create profile in public.profiles:', error.message);
      throw new Error(`Profile creation failed: ${error.message}`);
    }

    // Ensure corresponding rows exist in emergency_profiles and preparedness
    await supabase.from('emergency_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' });
    await supabase.from('preparedness').upsert({ user_id: userId }, { onConflict: 'user_id' });

    return data as UserProfile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) console.error('Error updating profile in Supabase:', error.message);
    }
  },

  async getEmergencyProfile(userId: string): Promise<EmergencyProfile | null> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('emergency_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) return data as EmergencyProfile;
    }
    return null;
  },

  async updateEmergencyProfile(userId: string, data: Partial<EmergencyProfile>): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { error } = await supabase
        .from('emergency_profiles')
        .upsert({
          user_id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        });

      if (error) console.error('Error updating emergency profile in Supabase:', error.message);
    }
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadErr) {
          console.warn('Supabase storage upload error:', uploadErr.message);
          return null;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const avatarUrl = data.publicUrl;

        await this.updateProfile(userId, { avatar_url: avatarUrl });
        return avatarUrl;
      } catch (err) {
        console.warn('Avatar upload exception:', err);
      }
    }
    return null;
  },
};
