import { useEffect, useRef, useState, useMemo } from 'react';
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
  onCanvasStateChange?: (state: {
    zoom: number;
    workingArea: { minX: number; minY: number; width: number; height: number };
    viewportTransform: number[] | null;
    containerSize: { width: number; height: number };
  }) => void;
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
  onCanvasStateChange,
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
  
  // Refs for panning to avoid stale closures
  const isPanningRef = useRef(false);
  const workingAreaRef = useRef(workingArea);
  const zoomRef = useRef(zoom);
  
  // Object pool pattern refs
  const objectPoolRef = useRef<Map<string, Group>>(new Map());
  const isDraggingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');
  
  // Refs for callbacks to avoid dependency issues
  const onCanvasStateChangeRef = useRef(onCanvasStateChange);
  
  // FIX 3: Stabilize event handlers with refs for data lookups
  const lanesRef = useRef(lanes);
  const cellSizeRef = useRef(cellSize);

  // Keep refs in sync with state
  useEffect(() => {
    isPanningRef.current = isPanning;
  }, [isPanning]);

  useEffect(() => {
    workingAreaRef.current = workingArea;
  }, [workingArea]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  
  // Keep callback ref in sync
  useEffect(() => {
    onCanvasStateChangeRef.current = onCanvasStateChange;
  }, [onCanvasStateChange]);
  
  // FIX 3: Keep data refs in sync
  useEffect(() => {
    lanesRef.current = lanes;
  }, [lanes]);
  
  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);

  // FIX 7: Throttle canvas state updates to 60fps
  const throttledStateUpdate = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (!canvas || !containerRef.current) return;
    
    if (throttledStateUpdate.current) {
      clearTimeout(throttledStateUpdate.current);
    }
    
    throttledStateUpdate.current = setTimeout(() => {
      onCanvasStateChangeRef.current?.({
        zoom,
        workingArea,
        viewportTransform: canvas.viewportTransform,
        containerSize: {
          width: containerRef.current!.clientWidth,
          height: containerRef.current!.clientHeight,
        },
      });
    }, 16); // 60fps max
    
    return () => {
      if (throttledStateUpdate.current) {
        clearTimeout(throttledStateUpdate.current);
      }
    };
  }, [zoom, workingArea, canvas]);

  // FIX 1: Remove debounced callback from dependencies - use setTimeout directly
  useEffect(() => {
    const timeoutRef = setTimeout(() => {
      const area = calculateWorkingArea(gates, lanes, stations, rooms, outsideAreas, storageLocations, zones);
      setWorkingArea(area);
    }, 100);
    
    return () => clearTimeout(timeoutRef);
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

  // FIX 2: Move hash check OUTSIDE useEffect using useMemo
  const currentDataHash = useMemo(() => {
    return JSON.stringify({
      editMode,
      gates: gates.map(g => `${g.id}-${g.grid_x}-${g.grid_y}-${g.grid_width}-${g.grid_height}`),
      lanes: lanes.map(l => `${l.id}-${l.grid_x}-${l.grid_y}-${l.grid_width}-${l.grid_height}`),
      stations: stations.map(s => `${s.id}-${s.grid_x}-${s.grid_y}-${s.grid_width}-${s.grid_height}`),
      rooms: rooms.map(r => `${r.id}-${r.grid_x}-${r.grid_y}-${r.grid_width}-${r.grid_height}-${r.color}`),
      outsideAreas: outsideAreas.map(o => `${o.id}-${o.grid_x}-${o.grid_y}-${o.grid_width}-${o.grid_height}`),
      storageLocations: storageLocations.map(s => `${s.id}-${s.grid_x}-${s.grid_y}-${s.grid_width}-${s.grid_height}`),
      zones: zones.map(z => `${z.id}-${z.grid_x}-${z.grid_y}-${z.grid_width}-${z.grid_height}`),
    });
  }, [gates, lanes, stations, rooms, outsideAreas, storageLocations, zones, editMode]);

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

  // FIX 2 & 4 & 5: Stable object pool rendering with optimized hash checking
  useEffect(() => {
    if (!canvas) return;
    
    // FIX 4: Skip updates during drag to prevent interference
    if (isDraggingRef.current) {
      console.log('⏸️ Skipping render during drag');
      return;
    }
    
    // FIX 2: Hash comparison happens BEFORE effect runs (via useMemo)
    if (currentDataHash === lastDataHashRef.current && objectPoolRef.current.size > 0) {
      return; // Effect doesn't execute if data unchanged
    }
    
    lastDataHashRef.current = currentDataHash;
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
    
    // FIX 5 & 6: Update or create blocks with drag detection and batched updates
    const updatedObjects: Group[] = [];
    const activeObject = canvas.getActiveObject();
    
    allBlocks.forEach(block => {
      const existing = objectPoolRef.current.get(block.id);
      
      if (existing) {
        // FIX 5: Skip updates if user is actively dragging THIS object
        if (isDraggingRef.current && activeObject === existing) {
          console.log(`⏸️ Skipping update for dragged object: ${block.id}`);
          return;
        }
        
        // Update existing object
        updateBlockObject(existing, block);
        
        // Update interactivity based on current editMode
        const isEditable = block.type === editMode;
        
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
        
        // Update data reference
        existing.set({ data: block } as any);
        
        // FIX 6: Batch setCoords calls
        updatedObjects.push(existing);
      } else {
        // Create new object
        console.log(`✨ Creating new block: ${block.id}`);
        const newObj = createBlock(block);
        objectPoolRef.current.set(block.id, newObj);
        canvas.add(newObj);
        updatedObjects.push(newObj);
      }
    });
    
    // FIX 6: Batch setCoords calls for better performance
    updatedObjects.forEach(obj => obj.setCoords());
    canvas.requestRenderAll();
  }, [canvas, currentDataHash, showGrid, editMode, cellSize]);

  // Handle object interactions
  useEffect(() => {
    if (!canvas) return;

  const handleObjectMoving = (e: any) => {
    isDraggingRef.current = true; // FIX 4: Mark drag as active
    
    const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const left = obj.left || 0;
      const top = obj.top || 0;

      // FIX 3: Use refs for data lookups
      const currentCellSize = cellSizeRef.current;

      // Snap to grid
      let snappedX = Math.round(left / currentCellSize);
      let snappedY = Math.round(top / currentCellSize);

      // Station-to-Lane parenting constraint
      if (block.type === 'station' && block.parent_id) {
        const parentLane = lanesRef.current.find(l => l.id === block.parent_id);
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
        left: snappedX * currentCellSize + (block.grid_width * currentCellSize) / 2,
        top: snappedY * currentCellSize + (block.grid_height * currentCellSize) / 2,
      });

      // Constrain to facility bounds (for non-station blocks)
      if (block.type !== 'station') {
        const maxX = facility.grid_width - block.grid_width;
        const maxY = facility.grid_height - block.grid_height;

        if (snappedX < 0) obj.set({ left: 0 });
        if (snappedY < 0) obj.set({ top: 0 });
        if (snappedX > maxX) obj.set({ left: maxX * currentCellSize });
        if (snappedY > maxY) obj.set({ top: maxY * currentCellSize });
      }
    };

    const handleObjectScaling = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      
      // FIX 3 & 9: Use cellSizeRef and fix resize logic
      const currentCellSize = cellSizeRef.current;
      
      // Calculate new dimensions from scale
      const newWidth = Math.max(1, Math.round((obj.width * obj.scaleX) / currentCellSize));
      const newHeight = Math.max(1, Math.round((obj.height * obj.scaleY) / currentCellSize));
      
      const pixelWidth = newWidth * currentCellSize;
      const pixelHeight = newHeight * currentCellSize;
      
      // FIX 9: Reset scale to 1 and update dimensions directly
      // This prevents fighting with the rendering loop
      obj.set({
        scaleX: 1,
        scaleY: 1,
        width: pixelWidth,
        height: pixelHeight,
      });

      // Update rect position to stay centered
      const rect = obj._objects?.[0];
      if (rect) {
        rect.set({
          left: -pixelWidth / 2,
          top: -pixelHeight / 2,
          width: pixelWidth,
          height: pixelHeight,
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
      
      // FIX 3: Use cellSizeRef
      const currentCellSize = cellSizeRef.current;
      
      // Calculate grid position from center
      const gridX = Math.round((obj.left! - objWidth / 2) / currentCellSize);
      const gridY = Math.round((obj.top! - objHeight / 2) / currentCellSize);
      const gridWidth = Math.round(objWidth / currentCellSize);
      const gridHeight = Math.round(objHeight / currentCellSize);

      // Update the data reference so our object pool stays in sync
      obj.set({ data: { ...block, grid_x: gridX, grid_y: gridY, grid_width: gridWidth, grid_height: gridHeight } } as any);

      // FIX 4: Clear drag flag BEFORE calling callbacks to prevent race conditions
      isDraggingRef.current = false;
      
      // FIX 4 & 8: Use requestAnimationFrame to prevent re-render race condition
      requestAnimationFrame(() => {
        if (gridX !== block.grid_x || gridY !== block.grid_y) {
          onBlockMove(block.id, gridX, gridY);
        }

        if (gridWidth !== block.grid_width || gridHeight !== block.grid_height) {
          onBlockResize(block.id, gridX, gridY, gridWidth, gridHeight);
        }
      });
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
  }, [canvas, facility, onBlockMove, onBlockResize, onBlockSelect]); // FIX 3: Removed unstable dependencies

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
      if (isPanningRef.current) {
        // Space key is already pressed
        canvas.selection = false;
        lastPosRef.current = { x: e.e.clientX, y: e.e.clientY };
      } else if (e.e.button === 1) {
        // Middle mouse button
        canvas.selection = false;
        setIsPanning(true);
        lastPosRef.current = { x: e.e.clientX, y: e.e.clientY };
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isPanningRef.current || !canvas.viewportTransform) return;
      
      const vpt = canvas.viewportTransform;
      const deltaX = e.e.clientX - lastPosRef.current.x;
      const deltaY = e.e.clientY - lastPosRef.current.y;
      
      vpt[4] += deltaX;
      vpt[5] += deltaY;
      
      // Constrain panning to keep working area in view - READ FROM REFS
      const { minX, minY, width: gridWidth, height: gridHeight } = workingAreaRef.current;
      const currentZoom = zoomRef.current;
      const startX = minX * cellSize * currentZoom;
      const startY = minY * cellSize * currentZoom;
      const endX = startX + gridWidth * cellSize * currentZoom;
      const endY = startY + gridHeight * cellSize * currentZoom;
      
      const containerWidth = containerRef.current?.clientWidth || 1000;
      const containerHeight = containerRef.current?.clientHeight || 700;
      
      // Allow panning slightly beyond edges (25% overflow)
      const maxOffsetX = gridWidth * cellSize * currentZoom * 0.25;
      const maxOffsetY = gridHeight * cellSize * currentZoom * 0.25;
      
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
    };

    const handleMouseUp = () => {
      if (isPanningRef.current) {
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
  }, [canvas]);

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
