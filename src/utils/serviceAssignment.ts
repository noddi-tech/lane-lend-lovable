import { supabase } from '@/integrations/supabase/client';
import type { SalesItem } from '@/types/booking';

export interface ServiceAssignment {
  salesItems: SalesItem[];
  totalServiceTime: number;
}

const serviceWeights: Record<string, number> = {
  'Oil Change': 0.35,
  'Tire Rotation': 0.25,
  'Full Diagnostic': 0.15,
  'EV Battery Check': 0.15,
  'Heavy Vehicle Inspection': 0.10,
};

function weightedRandomSelection(items: SalesItem[]): SalesItem {
  // Try to use predefined weights, fallback to equal weight
  const weights = items.map(item => serviceWeights[item.name] || (1 / items.length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return items[i];
    }
  }
  
  return items[0]; // fallback
}

async function getLaneCapabilities(laneId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('lane_capabilities')
    .select('capability_id')
    .eq('lane_id', laneId);
  
  if (error || !data) return [];
  return data.map(lc => lc.capability_id);
}

async function getServiceCapabilities(salesItemId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('sales_item_capabilities')
    .select('capability_id')
    .eq('sales_item_id', salesItemId);
  
  if (error || !data) return [];
  return data.map(sc => sc.capability_id);
}

function hasAllCapabilities(available: string[], required: string[]): boolean {
  return required.every(cap => available.includes(cap));
}

export async function assignServices(
  laneId: string,
  availableSalesItems: SalesItem[]
): Promise<ServiceAssignment> {
  const laneCapabilities = await getLaneCapabilities(laneId);
  
  // Filter sales items that lane can handle
  const compatibleItems: SalesItem[] = [];
  for (const item of availableSalesItems) {
    const requiredCapabilities = await getServiceCapabilities(item.id);
    if (hasAllCapabilities(laneCapabilities, requiredCapabilities)) {
      compatibleItems.push(item);
    }
  }
  
  if (compatibleItems.length === 0) {
    // Fallback: use any item (simulation mode)
    compatibleItems.push(...availableSalesItems);
  }
  
  // 70% single service, 30% multi-service
  const isMultiService = Math.random() > 0.7;
  const selectedItems: SalesItem[] = [];
  
  if (isMultiService && compatibleItems.length >= 2) {
    // Select 2-3 services
    const count = Math.random() > 0.5 ? 2 : 3;
    const shuffled = [...compatibleItems].sort(() => Math.random() - 0.5);
    selectedItems.push(...shuffled.slice(0, Math.min(count, compatibleItems.length)));
  } else {
    // Single service
    selectedItems.push(weightedRandomSelection(compatibleItems));
  }
  
  const totalServiceTime = selectedItems.reduce((sum, item) => sum + item.service_time_seconds, 0);
  
  return {
    salesItems: selectedItems,
    totalServiceTime,
  };
}
