import { createClient } from '@supabase/supabase-js';
import type { Quotation } from '../types/quotations';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchQuotations(after?: Date): Promise<Quotation[]> {
  let query = supabase
    .from('quotations')
    .select('*')
    .order('time', { ascending: true })
    .limit(1000);

  if (after) {
    query = query.gt('time', after.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }

  return (data || []).map((q: any) => ({
    ...q,
    time: new Date(q.time),
  }));
}
