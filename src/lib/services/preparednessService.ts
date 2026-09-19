import { supabase, isSupabaseConfigured } from '../supabase';

export interface PreparednessData {
  user_id: string;
  kit_items: Record<string, boolean>;
  go_bag_items: Record<string, boolean>;
  emergency_plan: Record<string, any>;
  review_status: Record<string, boolean>;
  score: number;
  updated_at?: string;
}

export const preparednessService = {
  calculateScore(
    kitItems: Record<string, boolean> = {},
    goBagItems: Record<string, boolean> = {},
    emergencyPlan: Record<string, any> = {},
    reviewStatus: Record<string, boolean> = {}
  ): number {
    const kitCount = Object.values(kitItems).filter(Boolean).length;
    const gobagCount = Object.values(goBagItems).filter(Boolean).length;
    const reviewCount = Object.values(reviewStatus).filter(Boolean).length;
    const hasPlan = Boolean(
      emergencyPlan &&
        (emergencyPlan.primaryContact?.name ||
          emergencyPlan.outOfAreaContact?.name ||
          emergencyPlan.primaryMeeting)
    );

    const kitPct = (kitCount / 23) * 35;
    const gobagPct = (gobagCount / 10) * 25;
    const planPct = hasPlan ? 25 : 0;
    const reviewPct = (reviewCount / 6) * 15;

    return Math.min(100, Math.round(kitPct + gobagPct + planPct + reviewPct));
  },

  async getPreparedness(userId: string): Promise<PreparednessData | null> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const { data, error } = await supabase
        .from('preparedness')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) return data as PreparednessData;
    }
    return null;
  },

  async savePreparedness(userId: string, data: Partial<PreparednessData>): Promise<void> {
    if (isSupabaseConfigured() && userId && userId !== 'local-user-id') {
      const current = await this.getPreparedness(userId);
      const kit_items = data.kit_items ?? current?.kit_items ?? {};
      const go_bag_items = data.go_bag_items ?? current?.go_bag_items ?? {};
      const emergency_plan = data.emergency_plan ?? current?.emergency_plan ?? {};
      const review_status = data.review_status ?? current?.review_status ?? {};
      const score = this.calculateScore(kit_items, go_bag_items, emergency_plan, review_status);

      const { error } = await supabase
        .from('preparedness')
        .upsert({
          user_id: userId,
          kit_items,
          go_bag_items,
          emergency_plan,
          review_status,
          score,
          updated_at: new Date().toISOString(),
        });

      if (error) console.error('Error saving preparedness to Supabase:', error.message);
    }
  },
};
