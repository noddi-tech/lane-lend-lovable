// Legacy compatibility re-export
// This file has been replaced by UnifiedGridBuilder
import { UnifiedGridBuilder } from './UnifiedGridBuilder';
export { UnifiedGridBuilder as BlockGridBuilder } from './UnifiedGridBuilder';

export type EditMode = 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage' | 'zone' | 'view';

// Legacy types for compatibility
export interface LayoutBlock {
  id: string;
  type: string;
  name: string;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  parent_id?: string;
  color?: string;
  area_type?: string;
  storage_type?: string;
  status?: string;
  zone_type?: string;
}

export type GroupMode = 'facility' | 'spaces' | 'operations';

export const ELEMENT_TO_GROUP: Partial<Record<EditMode, GroupMode>> = {
  facility: 'facility',
  gate: 'operations',
  lane: 'operations',
  station: 'operations',
  room: 'spaces',
  outside: 'spaces',
  storage: 'operations',
  zone: 'spaces',
  view: undefined,
};

export const GROUP_TO_ELEMENTS: Record<GroupMode, EditMode[]> = {
  facility: ['facility'],
  spaces: ['room', 'outside', 'zone'],
  operations: ['gate', 'lane', 'station', 'storage'],
};
