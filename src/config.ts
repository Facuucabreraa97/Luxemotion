const getApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  url = url.replace(/\/$/, "");
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

export const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder',
  API_URL: getApiUrl(),
};
