import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

const isPlaceholder = (value: string) =>
  value.includes('your-project-ref') ||
  value.includes('your-supabase-anon-key') ||
  value.startsWith('<') ||
  value === 'placeholder-anon-key';

const hasValidUrl = (() => {
  try {
    const url = new URL(supabaseUrl);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
})();

export const isSupabaseConfigured = (): boolean =>
  hasValidUrl && !isPlaceholder(supabaseUrl) && Boolean(supabaseAnonKey) && !isPlaceholder(supabaseAnonKey);

export const getSupabaseConfigError = (): Error & { status: number; code: string } => {
  const invalidVariables: string[] = [];

  if (!supabaseUrl || !hasValidUrl || isPlaceholder(supabaseUrl)) {
    invalidVariables.push('VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || isPlaceholder(supabaseAnonKey)) {
    invalidVariables.push('VITE_SUPABASE_ANON_KEY');
  }

  const error = new Error(
    `Supabase configuration is missing or invalid: ${invalidVariables.join(', ')}. Add the existing project's values in .env.local for local development and in Vercel Project Settings > Environment Variables for the target environment, then restart or redeploy.`
  ) as Error & { status: number; code: string };
  error.name = 'SupabaseConfigError';
  error.status = 400;
  error.code = 'MISSING_ENV_VARS';
  return error;
};

// Services import this client even when configuration is unavailable; keep construction non-throwing.
const validUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const validKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
