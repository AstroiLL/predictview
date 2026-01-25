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
    .select('*');

  if (after) {
    // При дозагрузке: получаем новые записи после указанного времени
    query = query
      .order('time', { ascending: true })
      .gt('time', after.toISOString());
  } else {
    // При начальной загрузке: получаем последние 1000 записей
    query = query
      .order('time', { ascending: false })
      .limit(1000);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }

  let result = (data || []).map((q: any) => ({
    ...q,
    time: new Date(q.time),
  }));

  // Если это начальная загрузка (без after), сортируем по возрастанию времени
  if (!after) {
    result = result.reverse();
  }

  return result;
}
