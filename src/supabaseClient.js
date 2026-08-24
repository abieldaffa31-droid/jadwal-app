import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kypsxedngcpjypbybccj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cHN4ZWRuZ2NwanlwYnliY2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2OTgyNzMsImV4cCI6MjEwMjI3NDI3M30.I1m9CWsbtPwyc6lss4Ll7BkbHr_l_b8IXgDJHzUVCJU';

const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');

  const url = envUrl || localUrl || DEFAULT_SUPABASE_URL;
  const key = envKey || localKey || DEFAULT_SUPABASE_ANON_KEY;

  return { url, key };
};

export const getSupabase = () => {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Supabase init error:', e);
      return null;
    }
  }
  return null;
};

