import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Eye, EyeOff, Home } from 'lucide-react';
import { calculateOptimalBoundary } from '@/utils/facilityBoundaryCalculator';

// Individual element types
export type EditMode = 'view' | 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage' | 'zone';

// Grouped mode type
export type GroupMode = 'spaces' | 'workflow' | 'storage';

// Mapping of groups to element types
export const GROUP_TO_ELEMENTS: Record<GroupMode, EditMode[]> = {
  spaces: ['room', 'outside', 'zone'],
  workflow: ['gate', 'lane', 'station'],
  storage: ['storage'],
};

// Reverse mapping: element to group
export const ELEMENT_TO_GROUP: Record<EditMode, GroupMode | null> = {
  view: null,
  facility: null,
  room: 'spaces',
  outside: 'spaces',
  zone: 'spaces',
  gate: 'workflow',
  lane: 'workflow',
  station: 'workflow',
  storage: 'storage',
};

export interface ViewContext {
  type: 'facility' | 'room';
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
}

export interface LayoutBlock {
  id: string;
  type: 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage' | 'zone';
  name: string;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  parent_id?: string;
  color?: string;
  is_library?: boolean;
  lane_type?: 'service' | 'storage' | 'staging';
  area_type?: string;
  storage_type?: string;
  status?: string;
}

interface BlockGridBuilderProps {
  facility: LayoutBlock;
  gates: LayoutBlock[];
  lanes: LayoutBlock[];
  stations: LayoutBlock[];
  rooms?: LayoutBlock[];
  outsideAreas?: LayoutBlock[];
  storageLocations?: LayoutBlock[];
  zones?: LayoutBlock[];
  editMode: EditMode;
  viewContext: ViewContext;
  onBlockMove: (blockId: string, gridX: number, gridY: number) => void;
  onBlockResize: (blockId: string, gridX: number, gridY: number, gridWidth: number, gridHeight: number) => void;
  onBlockSelect: (block: LayoutBlock | null) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDelete?: (block: LayoutBlock) => void;
  onReturnToLibrary?: (block: LayoutBlock) => void;
  onEnterRoom?: (roomId: string) => void;
  onEnterZone?: (zoneId: string) => void;
}

// Dynamic cell size calculation - allow much smaller cells for large grids
const calculateCellSize = (containerWidth: number, gridWidth: number): number => {
  // Calculate cell size to make grid fill most of the available width
  const targetFillRatio = 0.85; // Use 85% of available width
  const calculatedSize = (containerWidth * targetFillRatio) / gridWidth;
  
  // Allow smaller cells (5px min) for very large grids, up to 60px max
  return Math.max(5, Math.min(60, Math.floor(calculatedSize)));
};

const DEFAULT_CELL_SIZE = 30; // Fallback if calculation fails
const DEFAULT_WORKING_AREA = { width: 1000, height: 1000 }; // Match facility grid default
const WORKING_AREA_PADDING = 20; // Extra cells around content

// Calculate the actual working area based on placed elements
const calculateWorkingArea = (
  gates: LayoutBlock[],
  lanes: LayoutBlock[],
  stations: LayoutBlock[],
  rooms: LayoutBlock[],
  outsideAreas: LayoutBlock[],
  storageLocations: LayoutBlock[],
  zones: LayoutBlock[]
) => {
  const allBlocks = [...gates, ...lanes, ...stations, ...rooms, ...outsideAreas, ...storageLocations, ...zones];
  
  if (allBlocks.length === 0) {
    // Empty canvas: use 1000×1000 default
    return { minX: 0, minY: 0, ...DEFAULT_WORKING_AREA };
  }
  
  // Find the bounding box of all elements
  const minX = Math.min(...allBlocks.map(b => b.grid_x));
  const minY = Math.min(...allBlocks.map(b => b.grid_y));
  const maxX = Math.max(...allBlocks.map(b => b.grid_x + b.grid_width));
  const maxY = Math.max(...allBlocks.map(b => b.grid_y + b.grid_height));
  
  // Calculate dimensions with padding
  const width = maxX - minX + (WORKING_AREA_PADDING * 2);
  const height = maxY - minY + (WORKING_AREA_PADDING * 2);
  
  // Add padding and ensure minimum size matches default
  return {
    minX: Math.max(0, minX - WORKING_AREA_PADDING),
    minY: Math.max(0, minY - WORKING_AREA_PADDING),
    width: Math.max(DEFAULT_WORKING_AREA.width, width),
    height: Math.max(DEFAULT_WORKING_AREA.height, height),
  };
};

const COLORS = {
  facility: { 
    fill: 'rgba(59, 130, 246, 0.05)', 
    stroke: '#3b82f6', 
    strokeWidth: 3,
    strokeDashArray: [10, 5],
    text: '#1e40af',
    opacity: 1
  },
  gate: { 
    fill: 'rgba(34, 197, 94, 0.15)', 
    stroke: '#22c55e', 
    strokeWidth: 2,
    strokeDashArray: [],
    text: '#166534',
    opacity: 1
  },
  outside: { 
    fill: 'rgba(156, 163, 175, 0.05)', 
    stroke: '#9ca3af', 
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    text: '#6b7280',
    opacity: 0.6
  },
  storage: { 
    fill: 'rgba(245, 158, 11, 0.2)', 
    stroke: '#f59e0b', 
    strokeWidth: 1,
    strokeDashArray: [2, 2],
    text: '#92400e',
    opacity: 1
  },
  lane: { 
    fill: 'rgba(168, 85, 247, 0.15)', 
    stroke: '#a855f7', 
    strokeWidth: 2,
    strokeDashArray: [],
    text: '#6b21a8',
    opacity: 1
  },
  station: { 
    fill: 'rgba(239, 68, 68, 0.15)', 
    stroke: '#ef4444', 
    strokeWidth: 2,
    strokeDashArray: [],
    text: '#991b1b',
    opacity: 1
  },
  room: { 
    fill: 'rgba(99, 102, 241, 0.1)', 
    stroke: '#6366f1', 
    strokeWidth: 3,
    strokeDashArray: [15, 5],
    text: '#3730a3',
    opacity: 1
  },
  zone: {
    fill: 'rgba(139, 92, 246, 0.08)',
    stroke: '#8b5cf6',
    strokeWidth: 2,
    strokeDashArray: [8, 4],
    text: '#6d28d9',
    opacity: 0.8,
  },
};

export function BlockGridBuilder({
  facility,
  gates,
  lanes,
  stations,
  rooms = [],
  outsideAreas = [],
  storageLocations = [],
  zones = [],
  editMode,
  viewContext,
  onBlockMove,
  onBlockResize,
  onBlockSelect,
  onDrop,
  onDelete,
  onReturnToLibrary,
  onEnterRoom,
  onEnterZone,
}: BlockGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1000, height: 700 });
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [isPanning, setIsPanning] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [showBoundaryPreview, setShowBoundaryPreview] = useState(false);
  const [boundaryMargin, setBoundaryMargin] = useState(5);
  const [workingArea, setWorkingArea] = useState({ minX: 0, minY: 0, width: 1000, height: 1000 });
  
  // Object pool pattern refs
  const objectPoolRef = useRef<Map<string, Group>>(new Map());
  const isDraggingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');

  // Recalculate working area when elements change
  useEffect(() => {
    const area = calculateWorkingArea(gates, lanes, stations, rooms, outsideAreas, storageLocations, zones);
    setWorkingArea(area);
  }, [gates, lanes, stations, rooms, outsideAreas, storageLocations, zones]);

  // Calculate responsive canvas size and cell size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const padding = 0; // No padding needed - controls are positioned absolutely
      
      setCanvasDimensions({ 
        width: width - padding, 
        height: height - padding 
      });
      
      // Use a default grid size for infinite canvas (1000x1000 cells)
      const defaultGridCells = 1000;
      const optimalCellSize = Math.min(
        (width - padding) / defaultGridCells,
        (height - padding) / defaultGridCells
      );
      setCellSize(Math.max(10, Math.min(40, Math.floor(optimalCellSize))));
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [facility.grid_width, facility.grid_height]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: 'hsl(222, 47%, 11%)',
      selection: true,
      preserveObjectStacking: true,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Update canvas dimensions
  useEffect(() => {
    if (!canvas) return;
    canvas.setDimensions(canvasDimensions);
    canvas.renderAll();
  }, [canvas, canvasDimensions]);

  // Helper: Generate stable hash of data for change detection
  const generateDataHash = (
    gates: LayoutBlock[], 
    lanes: LayoutBlock[], 
    stations: LayoutBlock[], 
    rooms: LayoutBlock[], 
    outsideAreas: LayoutBlock[], 
    storageLocations: LayoutBlock[], 
    mode: EditMode
  ) => {
    return JSON.stringify({
      editMode: mode,
      gates: gates.map(g => `${g.id}-${g.grid_x}-${g.grid_y}-${g.grid_width}-${g.grid_height}`),
      lanes: lanes.map(l => `${l.id}-${l.grid_x}-${l.grid_y}-${l.grid_width}-${l.grid_height}`),
      stations: stations.map(s => `${s.id}-${s.grid_x}-${s.grid_y}-${s.grid_width}-${s.grid_height}`),
      rooms: rooms.map(r => `${r.id}-${r.grid_x}-${r.grid_y}-${r.grid_width}-${r.grid_height}-${r.color}`),
      outsideAreas: outsideAreas.map(o => `${o.id}-${o.grid_x}-${o.grid_y}-${o.grid_width}-${o.grid_height}`),
      storageLocations: storageLocations.map(s => `${s.id}-${s.grid_x}-${s.grid_y}-${s.grid_width}-${s.grid_height}`),
    });
  };

  // Helper: Update existing object without destroying it
  const updateBlockObject = (group: Group, block: LayoutBlock) => {
    group.set({
      left: block.grid_x * cellSize + (block.grid_width * cellSize) / 2,
      top: block.grid_y * cellSize + (block.grid_height * cellSize) / 2,
      originX: 'center',
      originY: 'center',
    });
    
    // Update rect dimensions
    const rect = group._objects?.[0] as Rect;
    if (rect) {
      rect.set({
        left: -(block.grid_width * cellSize) / 2,
        top: -(block.grid_height * cellSize) / 2,
        width: block.grid_width * cellSize,
        height: block.grid_height * cellSize,
      });
    }
    
    // Update text
    const text = group._objects?.[1] as Text;
    if (text) {
      text.set({
        text: block.name,
        left: 0,
        top: 0,
      });
    }
    
    group.setCoords();
  };

  // Stable object pool rendering - objects persist and update in-place
  useEffect(() => {
    if (!canvas) return;
    
    // Skip updates during drag to prevent interference
    if (isDraggingRef.current) {
      console.log('⏸️ Skipping render during drag');
      return;
    }
    
    // Check if data actually changed
    const currentHash = generateDataHash(gates, lanes, stations, rooms, outsideAreas, storageLocations, editMode);
    const dataChanged = currentHash !== lastDataHashRef.current;
    lastDataHashRef.current = currentHash;
    
    if (!dataChanged && objectPoolRef.current.size > 0) {
      console.log('✓ Data unchanged, skipping render');
      return;
    }

    console.log('🔄 Updating canvas objects');

    // Clear only static elements (grid, facility boundary)
    const interactiveObjects = canvas.getObjects().filter(obj => {
      const block = (obj as any).data as LayoutBlock | undefined;
      return block && (block.type === 'gate' || block.type === 'lane' || block.type === 'station' || block.type === 'room' || block.type === 'outside' || block.type === 'storage' || block.type === 'zone');
    });
    
    canvas.getObjects().forEach(obj => {
      if (!interactiveObjects.includes(obj)) {
        canvas.remove(obj);
      }
    });
    
    // Redraw static elements
    canvas.backgroundColor = 'hsl(222, 47%, 11%)';
    
    // Draw grid lines - constrained to working area
    if (showGrid) {
      const { minX, minY, width: gridWidth, height: gridHeight } = workingArea;
      
      // Vertical lines (regular)
      for (let i = 0; i <= gridWidth; i++) {
        const line = new Rect({
          left: (minX + i) * cellSize,
          top: minY * cellSize,
          width: 1,
          height: gridHeight * cellSize,
          fill: 'rgba(255, 255, 255, 0.15)', // Better contrast (was 0.05)
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }

      // Horizontal lines (regular)
      for (let j = 0; j <= gridHeight; j++) {
        const line = new Rect({
          left: minX * cellSize,
          top: (minY + j) * cellSize,
          width: gridWidth * cellSize,
          height: 1,
          fill: 'rgba(255, 255, 255, 0.15)', // Better contrast
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
      
      // Major grid lines every 100 cells (since grid is 1000×1000)
      for (let i = 0; i <= gridWidth; i += 100) {
        const line = new Rect({
          left: (minX + i) * cellSize,
          top: minY * cellSize,
          width: 2, // Thicker
          height: gridHeight * cellSize,
          fill: 'rgba(255, 255, 255, 0.25)', // More visible
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }

      for (let j = 0; j <= gridHeight; j += 100) {
        const line = new Rect({
          left: minX * cellSize,
          top: (minY + j) * cellSize,
          width: gridWidth * cellSize,
          height: 2, // Thicker
          fill: 'rgba(255, 255, 255, 0.25)', // More visible
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
      
      // Add subtle working area border
      const workingAreaBorder = new Rect({
        left: minX * cellSize,
        top: minY * cellSize,
        width: gridWidth * cellSize,
        height: gridHeight * cellSize,
        fill: 'transparent',
        stroke: 'rgba(59, 130, 246, 0.3)',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
      });
      canvas.add(workingAreaBorder);
    }

    // Facility boundary removed - infinite grid
    
    // Draw boundary preview if enabled
    if (showBoundaryPreview) {
      const allBlocks = [...gates, ...lanes, ...stations, ...rooms, ...outsideAreas, ...storageLocations, ...zones];
      if (allBlocks.length > 0) {
        const boundary = calculateOptimalBoundary(allBlocks, boundaryMargin);
        
        const boundaryRect = new Rect({
          left: boundary.grid_x * cellSize,
          top: boundary.grid_y * cellSize,
          width: boundary.grid_width * cellSize,
          height: boundary.grid_height * cellSize,
          fill: 'rgba(59, 130, 246, 0.05)',
          stroke: '#3b82f6',
          strokeWidth: 3,
          strokeDashArray: [10, 5],
          selectable: false,
          evented: false,
        });
        
        // Add label
        const boundaryLabel = new Text(`Boundary: ${boundary.grid_width}×${boundary.grid_height} (${boundary.elements_count} elements)`, {
          left: boundary.grid_x * cellSize + 10,
          top: boundary.grid_y * cellSize + 10,
          fontSize: 14,
          fill: '#3b82f6',
          fontFamily: 'monospace',
          selectable: false,
          evented: false,
        });
        
        canvas.add(boundaryRect);
        canvas.add(boundaryLabel);
      }
    }

    // Helper to create new block
    const createBlock = (block: LayoutBlock) => {
      const isEditable = block.type === editMode;
      const isLane = block.type === 'lane';
      const isRoom = block.type === 'room';
      
      // Use custom color for rooms if provided
      const colors = block.color && isRoom 
        ? { 
            fill: `${block.color}26`, // Add alpha
            stroke: block.color, 
            text: block.color 
          }
        : COLORS[block.type];
      
      const rect = new Rect({
        left: -(block.grid_width * cellSize) / 2,
        top: -(block.grid_height * cellSize) / 2,
        width: block.grid_width * cellSize,
        height: block.grid_height * cellSize,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: (colors as any).strokeWidth || 2,
        strokeDashArray: (colors as any).strokeDashArray || [],
        rx: 4,
        ry: 4,
        opacity: (colors as any).opacity || 1,
      });

      const text = new Text(block.name, {
        left: 0,
        top: 0,
        fontSize: Math.max(12, Math.min(18, block.grid_width * 1.5)),
        fill: COLORS[block.type].text,
        originX: 'center',
        originY: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
      });

      const group = new Group([rect, text], {
        left: block.grid_x * cellSize + (block.grid_width * cellSize) / 2,
        top: block.grid_y * cellSize + (block.grid_height * cellSize) / 2,
        originX: 'center',
        originY: 'center',
        selectable: isEditable,
        hasControls: isEditable,
        lockRotation: true,
        evented: isEditable,
        hoverCursor: isEditable ? 'move' : 'default',
        lockMovementX: !isEditable,
        lockMovementY: !isEditable,
        lockScalingX: !isEditable,
        lockScalingY: !isEditable,
        opacity: isEditable ? 1 : (block.type === 'facility' ? 1 : 0.5),
        subTargetCheck: false,
      });

      group.set({ data: block } as any);
      return group;
    };

    // Process blocks: Update existing or create new (maintain Z-order: outside (background), zones, rooms, lanes, gates, stations, storage)
    const allBlocks = [...outsideAreas, ...zones, ...rooms, ...lanes, ...gates, ...stations, ...storageLocations];
    const currentBlockIds = new Set(allBlocks.map(b => b.id));
    
    // Remove deleted blocks
    objectPoolRef.current.forEach((obj, id) => {
      if (!currentBlockIds.has(id)) {
        console.log(`🗑️ Removing deleted block: ${id}`);
        canvas.remove(obj);
        objectPoolRef.current.delete(id);
      }
    });
    
    // Update or create blocks (maintain Z-order: lanes, gates, stations)
    allBlocks.forEach(block => {
      const existing = objectPoolRef.current.get(block.id);
      
      if (existing) {
        // Update existing object
        updateBlockObject(existing, block);
        
        // Update interactivity based on current editMode
        const isEditable = block.type === editMode;
        const isLane = block.type === 'lane';
        
      console.log(`🔄 Updating ${block.type} ${block.id}:`, { 
        isEditable, 
        selectable: isEditable,
        evented: isEditable,
        lockMovementX: !isEditable,
        lockMovementY: !isEditable
      });
      
      existing.set({
        selectable: isEditable,
        evented: isEditable,
        hasControls: isEditable,
        hoverCursor: isEditable ? 'move' : 'default',
        lockMovementX: !isEditable,
        lockMovementY: !isEditable,
        lockScalingX: !isEditable,
        lockScalingY: !isEditable,
        opacity: isEditable ? 1 : (block.type === 'facility' ? 1 : 0.5),
      });
      
      existing.setCoords(); // Update interaction boundaries
        
        // Update data reference
        existing.set({ data: block } as any);
      } else {
        // Create new object
        console.log(`✨ Creating new block: ${block.id}`);
        const newObj = createBlock(block);
        objectPoolRef.current.set(block.id, newObj);
        canvas.add(newObj);
    }
  });
  
  // Force thorough canvas refresh
  canvas.getObjects().forEach(obj => {
    if ((obj as any).data) {
      obj.setCoords();
    }
  });
  canvas.requestRenderAll();
  }, [canvas, facility, gates, lanes, stations, rooms, outsideAreas, storageLocations, zones, showGrid, editMode, cellSize]);

  // Handle object interactions
  useEffect(() => {
    if (!canvas) return;

  const handleObjectMoving = (e: any) => {
    isDraggingRef.current = true; // Mark drag as active
    
    const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      console.log(`👆 Object moving:`, { type: block?.type, id: block?.id });
      const left = obj.left || 0;
      const top = obj.top || 0;

      // Snap to grid
      let snappedX = Math.round(left / cellSize);
      let snappedY = Math.round(top / cellSize);

      // Station-to-Lane parenting constraint
      if (block.type === 'station' && block.parent_id) {
        const parentLane = lanes.find(l => l.id === block.parent_id);
        if (parentLane) {
          // Constrain to parent lane bounds
          const laneMinX = parentLane.grid_x;
          const laneMaxX = parentLane.grid_x + parentLane.grid_width - block.grid_width;
          const laneMinY = parentLane.grid_y;
          const laneMaxY = parentLane.grid_y + parentLane.grid_height - block.grid_height;

          snappedX = Math.max(laneMinX, Math.min(laneMaxX, snappedX));
          snappedY = Math.max(laneMinY, Math.min(laneMaxY, snappedY));

          // Visual feedback: flash lane border when near edge
          if (snappedX === laneMinX || snappedX === laneMaxX || 
              snappedY === laneMinY || snappedY === laneMaxY) {
            const laneObj = canvas.getObjects().find(o => 
              (o as any).data?.id === block.parent_id
            );
            if (laneObj) {
              const rect = (laneObj as any)._objects?.[0];
              if (rect) {
                rect.set({ stroke: '#ef4444', strokeWidth: 3 });
                setTimeout(() => {
                  rect.set({ stroke: COLORS.lane.stroke, strokeWidth: 2 });
                  canvas.renderAll();
                }, 200);
              }
            }
          }
        }
      }

      // Allow free movement for all blocks (account for centered origin)
      obj.set({
        left: snappedX * cellSize + (block.grid_width * cellSize) / 2,
        top: snappedY * cellSize + (block.grid_height * cellSize) / 2,
      });

      // Constrain to facility bounds (for non-station blocks)
      if (block.type !== 'station') {
        const maxX = facility.grid_width - block.grid_width;
        const maxY = facility.grid_height - block.grid_height;

        if (snappedX < 0) obj.set({ left: 0 });
        if (snappedY < 0) obj.set({ top: 0 });
        if (snappedX > maxX) obj.set({ left: maxX * cellSize });
        if (snappedY > maxY) obj.set({ top: maxY * cellSize });
      }
    };

    const handleObjectScaling = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;

      // Get current dimensions
      const currentWidth = (obj.width || 0) * scaleX;
      const currentHeight = (obj.height || 0) * scaleY;

      // Snap to grid
      const newWidth = Math.max(
        cellSize * 2,
        Math.round(currentWidth / cellSize) * cellSize
      );
      const newHeight = Math.max(
        cellSize * 2,
        Math.round(currentHeight / cellSize) * cellSize
      );

      // Allow free resizing for all blocks
      obj.set({
        width: newWidth,
        height: newHeight,
        scaleX: 1,
        scaleY: 1,
      });

      // Update rect position to stay centered
      const rect = obj._objects?.[0];
      if (rect) {
        rect.set({
          left: -newWidth / 2,
          top: -newHeight / 2,
          width: newWidth,
          height: newHeight,
        });
      }

      // Update text position in the group (stays centered)
      const text = obj._objects?.[1];
      if (text) {
        text.set({
          left: 0,
          top: 0,
        });
      }

      obj.setCoords();
      canvas.renderAll();
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const objWidth = obj.width || 0;
      const objHeight = obj.height || 0;
      
      // Calculate grid position from center
      const gridX = Math.round((obj.left! - objWidth / 2) / cellSize);
      const gridY = Math.round((obj.top! - objHeight / 2) / cellSize);
      const gridWidth = Math.round(objWidth / cellSize);
      const gridHeight = Math.round(objHeight / cellSize);

      // Update the data reference so our object pool stays in sync
      obj.set({ data: { ...block, grid_x: gridX, grid_y: gridY, grid_width: gridWidth, grid_height: gridHeight } } as any);

      if (gridX !== block.grid_x || gridY !== block.grid_y) {
        onBlockMove(block.id, gridX, gridY);
      }

      if (gridWidth !== block.grid_width || gridHeight !== block.grid_height) {
        onBlockResize(block.id, gridX, gridY, gridWidth, gridHeight);
      }
      
      // Reset drag flag after a brief delay to allow mutation to complete
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 150);
    };

    const handleSelection = (e: any) => {
      const obj = e.selected?.[0];
      if (obj?.data) {
        onBlockSelect(obj.data as LayoutBlock);
      }
    };

    const handleSelectionCleared = () => {
      onBlockSelect(null);
    };

    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleSelectionCleared);

    return () => {
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas, facility, lanes, onBlockMove, onBlockResize, onBlockSelect, cellSize]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 5.0));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleFitToView = () => {
    if (!canvas || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth - 80; // Account for controls
    const containerHeight = containerRef.current.clientHeight - 120; // Account for legend
    
    const { minX, minY, width: gridWidth, height: gridHeight } = workingArea;
    
    // Calculate working area pixel dimensions
    const workingPixelWidth = gridWidth * cellSize;
    const workingPixelHeight = gridHeight * cellSize;
    
    // Calculate zoom to fit working area
    const zoomX = containerWidth / workingPixelWidth;
    const zoomY = containerHeight / workingPixelHeight;
    
    // Use the smaller zoom to ensure entire working area is visible
    const fitZoom = Math.min(zoomX, zoomY, 2); // Allow up to 200% zoom
    const finalZoom = Math.max(0.3, fitZoom); // Minimum 30% zoom for readability
    
    setZoom(finalZoom);
    
    // Center the working area in viewport
    if (canvas.viewportTransform) {
      const vpt = canvas.viewportTransform;
      
      // Calculate center offset
      const centerX = (containerWidth - workingPixelWidth * finalZoom) / 2;
      const centerY = (containerHeight - workingPixelHeight * finalZoom) / 2;
      
      vpt[4] = centerX - (minX * cellSize * finalZoom);
      vpt[5] = centerY - (minY * cellSize * finalZoom);
      
      canvas.setViewportTransform(vpt);
      canvas.renderAll();
    }
  };

  // Update zoom
  useEffect(() => {
    if (!canvas) return;
    canvas.setZoom(zoom);
    canvas.renderAll();
  }, [canvas, zoom]);

  // Auto fit-to-view on initial load
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    // Wait for layout to stabilize, then fit to view
    const timer = setTimeout(() => {
      handleFitToView();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [canvas, facility.grid_width, facility.grid_height]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'f':
          handleFitToView();
          break;
        case 'h':
          if (canvas?.viewportTransform) {
            canvas.viewportTransform[4] = 0;
            canvas.viewportTransform[5] = 0;
            canvas.renderAll();
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
        case '_':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
          break;
        case ' ':
          setIsPanning(true);
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pan functionality
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      if (isPanning || e.e.button === 1) { // Space key or middle mouse
        canvas.selection = false;
        setIsPanning(true);
        lastPosRef.current = { x: e.e.clientX, y: e.e.clientY };
      }
    };

    const handleMouseMove = (e: any) => {
      if (isPanning) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          const deltaX = e.e.clientX - lastPosRef.current.x;
          const deltaY = e.e.clientY - lastPosRef.current.y;
          
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          
          // Constrain panning to keep working area in view
          const { minX, minY, width: gridWidth, height: gridHeight } = workingArea;
          const startX = minX * cellSize * zoom;
          const startY = minY * cellSize * zoom;
          const endX = startX + gridWidth * cellSize * zoom;
          const endY = startY + gridHeight * cellSize * zoom;
          
          const containerWidth = containerRef.current?.clientWidth || 1000;
          const containerHeight = containerRef.current?.clientHeight || 700;
          
          // Allow panning slightly beyond edges (25% overflow)
          const maxOffsetX = gridWidth * cellSize * zoom * 0.25;
          const maxOffsetY = gridHeight * cellSize * zoom * 0.25;
          
          // Constrain X
          if (vpt[4] > maxOffsetX) vpt[4] = maxOffsetX;
          if (vpt[4] < containerWidth - endX - maxOffsetX) {
            vpt[4] = containerWidth - endX - maxOffsetX;
          }
          
          // Constrain Y
          if (vpt[5] > maxOffsetY) vpt[5] = maxOffsetY;
          if (vpt[5] < containerHeight - endY - maxOffsetY) {
            vpt[5] = containerHeight - endY - maxOffsetY;
          }
          
          canvas.requestRenderAll();
          lastPosRef.current = { x: e.e.clientX, y: e.e.clientY };
        }
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        canvas.selection = true;
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isPanning]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Working Area Info */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg px-3 py-1.5">
          <div className="text-xs font-mono text-muted-foreground">
            Grid: {workingArea.width} × {workingArea.height} cells
            {workingArea.minX > 0 && ` (offset: ${workingArea.minX}, ${workingArea.minY})`}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-2 space-y-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFitToView}
            title="Fit to View (F)"
            className="w-full"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fit View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (canvas?.viewportTransform) {
                canvas.viewportTransform[4] = 0;
                canvas.viewportTransform[5] = 0;
                canvas.renderAll();
              }
            }}
            title="Reset Pan Position (H)"
            className="w-full text-xs"
          >
            <Home className="h-3 w-3 mr-1" />
            Home
          </Button>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            title="100% Zoom (0)"
            className="w-full"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={showBoundaryPreview ? "default" : "outline"}
            size="icon"
            onClick={() => setShowBoundaryPreview(!showBoundaryPreview)}
            title="Toggle Boundary Preview (B)"
          >
            {showBoundaryPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        className="w-full h-full overflow-auto bg-slate-900 rounded-lg"
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* Legend & Shortcuts */}
      <div className="absolute bottom-4 left-4 space-y-2">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
          <div className="text-xs font-semibold mb-2">Legend</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.facility.stroke, backgroundColor: COLORS.facility.fill }} />
              <span>Facility</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.gate.stroke, backgroundColor: COLORS.gate.fill }} />
              <span>Gate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.lane.stroke, backgroundColor: COLORS.lane.fill }} />
              <span>Lane</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.station.stroke, backgroundColor: COLORS.station.fill }} />
              <span>Station</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.room.stroke, backgroundColor: COLORS.room.fill }} />
              <span>Room</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border" 
                style={{ 
                  borderColor: COLORS.zone.stroke, 
                  backgroundColor: COLORS.zone.fill,
                  borderStyle: 'dashed',
                  opacity: COLORS.zone.opacity
                }} 
              />
              <span>Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border" 
                style={{ 
                  borderColor: COLORS.outside.stroke, 
                  backgroundColor: COLORS.outside.fill,
                  borderStyle: 'dashed',
                  opacity: COLORS.outside.opacity
                }} 
              />
              <span>Outside</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border" 
                style={{ 
                  borderColor: COLORS.storage.stroke, 
                  backgroundColor: COLORS.storage.fill,
                  borderStyle: 'dotted',
                  borderWidth: 2
                }} 
              />
              <span>Storage</span>
            </div>
          </div>
        </div>
        
        <div className="bg-background/95 backdrop-blur-sm rounded-lg border shadow-lg p-3">
          <div className="text-xs font-semibold mb-2">Shortcuts</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div><kbd className="px-1 py-0.5 bg-muted rounded">F</kbd> Fit to view</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">H</kbd> Home position</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">+/-</kbd> Zoom in/out</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">0</kbd> Reset zoom</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> Pan canvas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
