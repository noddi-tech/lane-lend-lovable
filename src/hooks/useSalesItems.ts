import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SalesItem } from '@/types/booking';

export const useSalesItems = () => {
  return useQuery({
    queryKey: ['sales-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_items')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as SalesItem[];
    },
  });
};
