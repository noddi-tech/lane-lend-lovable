import { LayoutBlock } from '@/components/facility/BlockGridBuilder';

export interface BoundaryResult {
  grid_x: number;      // Top-left X of facility boundary
  grid_y: number;      // Top-left Y of facility boundary  
  grid_width: number;  // Width of facility
  grid_height: number; // Height of facility
  elements_count: number;
}

export const calculateOptimalBoundary = (
  blocks: LayoutBlock[],
  margin: number = 5
): BoundaryResult => {
  if (blocks.length === 0) {
    return {
      grid_x: 0,
      grid_y: 0,
      grid_width: 100,
      grid_height: 100,
      elements_count: 0,
    };
  }
  
  // Find bounding box of all elements
  const minX = Math.min(...blocks.map(b => b.grid_x));
  const minY = Math.min(...blocks.map(b => b.grid_y));
  const maxX = Math.max(...blocks.map(b => b.grid_x + b.grid_width));
  const maxY = Math.max(...blocks.map(b => b.grid_y + b.grid_height));
  
  // Add margin
  return {
    grid_x: minX - margin,
    grid_y: minY - margin,
    grid_width: (maxX - minX) + (margin * 2),
    grid_height: (maxY - minY) + (margin * 2),
    elements_count: blocks.length,
  };
};
