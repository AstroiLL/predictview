import { createClient } from '@supabase/supabase-js';
import type { Quotation, QuotationRaw } from '../types/quotations';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    // При начальной загрузке: получаем последние 3000 записей
    query = query
      .order('time', { ascending: false })
      .limit(3000);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }

  let result: Quotation[] = (data || []).map((q: QuotationRaw) => ({
    ...q,
    time: new Date(q.time),
  }));

  // Если это начальная загрузка (без after), сортируем по возрастанию времени
  if (!after) {
    result = result.reverse();
  }

  return result;
}
