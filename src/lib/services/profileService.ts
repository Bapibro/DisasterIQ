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
