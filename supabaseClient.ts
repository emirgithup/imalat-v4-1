import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './lib/safeStorage';

const supabaseUrl = 'https://odiwfguuvfztwkdnvsag.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaXdmZ3V1dmZ6dHdrZG52c2FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzAxNDEsImV4cCI6MjA4Mjg0NjE0MX0.2rrgi-q2IsV4_j0ajRZ6VRP3g-LBt52BY0WdpqjXnyU';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // iOS Safari & iOS Chrome (WebKit) navigator.locks kilitlenmesini önler
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return await fn();
    },
  },
});
