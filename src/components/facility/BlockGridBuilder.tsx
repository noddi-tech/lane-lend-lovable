import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react';

export type EditMode = 'view' | 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage';

export interface ViewContext {
  type: 'facility' | 'room';
  id: string;
  name: string;
  gridWidth: number;
  gridHeight: number;
}

export interface LayoutBlock {
  id: string;
  type: 'facility' | 'gate' | 'lane' | 'station' | 'room' | 'outside' | 'storage';
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
  editMode: EditMode;
  viewContext: ViewContext;
  onBlockMove: (blockId: string, gridX: number, gridY: number) => void;
  onBlockResize: (blockId: string, gridWidth: number, gridHeight: number) => void;
  onBlockSelect: (block: LayoutBlock | null) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDelete?: (block: LayoutBlock) => void;
  onReturnToLibrary?: (block: LayoutBlock) => void;
  onEnterRoom?: (roomId: string) => void;
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
};

export function BlockGridBuilder({
  facility,
  gates,
  lanes,
  stations,
  rooms = [],
  outsideAreas = [],
  storageLocations = [],
  editMode,
  viewContext,
  onBlockMove,
  onBlockResize,
  onBlockSelect,
  onDrop,
  onDelete,
  onReturnToLibrary,
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
  
  // Object pool pattern refs
  const objectPoolRef = useRef<Map<string, Group>>(new Map());
  const isDraggingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');

  // Calculate responsive canvas size and cell size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      
      // Calculate optimal cell size based on available width
      const optimalCellSize = calculateCellSize(width - 40, facility.grid_width);
      setCellSize(optimalCellSize);
      
      // Calculate canvas dimensions based on cell size and grid dimensions
      const canvasWidth = facility.grid_width * optimalCellSize;
      const canvasHeight = facility.grid_height * optimalCellSize;
      
      // Limit canvas to container size
      const finalWidth = Math.min(canvasWidth, width - 40);
      const finalHeight = Math.min(canvasHeight, height - 40);
      
      setCanvasDimensions({ width: finalWidth, height: finalHeight });
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
      left: block.grid_x * cellSize,
      top: block.grid_y * cellSize,
    });
    
    // Update rect dimensions
    const rect = group._objects?.[0] as Rect;
    if (rect) {
      rect.set({
        width: block.grid_width * cellSize,
        height: block.grid_height * cellSize,
      });
    }
    
    // Update text
    const text = group._objects?.[1] as Text;
    if (text) {
      text.set({
        text: block.name,
        left: (block.grid_width * cellSize) / 2,
        top: (block.grid_height * cellSize) / 2,
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
      return block && (block.type === 'gate' || block.type === 'lane' || block.type === 'station' || block.type === 'room' || block.type === 'outside' || block.type === 'storage');
    });
    
    canvas.getObjects().forEach(obj => {
      if (!interactiveObjects.includes(obj)) {
        canvas.remove(obj);
      }
    });
    
    // Redraw static elements
    canvas.backgroundColor = 'hsl(222, 47%, 11%)';
    
    // Draw grid lines
    if (showGrid) {
      for (let i = 0; i <= facility.grid_width; i++) {
        const line = new Rect({
          left: i * cellSize,
          top: 0,
          width: 1,
          height: facility.grid_height * cellSize,
          fill: 'rgba(255, 255, 255, 0.05)',
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }

      for (let j = 0; j <= facility.grid_height; j++) {
        const line = new Rect({
          left: 0,
          top: j * cellSize,
          width: facility.grid_width * cellSize,
          height: 1,
          fill: 'rgba(255, 255, 255, 0.05)',
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    }

    // Facility boundary removed - grid provides sufficient visual reference

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
        left: 0,
        top: 0,
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
        left: (block.grid_width * cellSize) / 2,
        top: (block.grid_height * cellSize) / 2,
        fontSize: Math.max(12, Math.min(18, block.grid_width * 1.5)),
        fill: COLORS[block.type].text,
        originX: 'center',
        originY: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
      });

      const group = new Group([rect, text], {
        left: block.grid_x * cellSize,
        top: block.grid_y * cellSize,
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

    // Process blocks: Update existing or create new (maintain Z-order: outside (background), rooms, lanes, gates, stations, storage)
    const allBlocks = [...outsideAreas, ...rooms, ...lanes, ...gates, ...stations, ...storageLocations];
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
  }, [canvas, facility, gates, lanes, stations, rooms, outsideAreas, storageLocations, showGrid, editMode, cellSize]);

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

      // Lane width lock - lanes stay at x=0
      if (block.type === 'lane') {
        obj.set({
          left: 0,
          top: snappedY * cellSize,
        });
      } else {
        obj.set({
          left: snappedX * cellSize,
          top: snappedY * cellSize,
        });
      }

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

      // For lanes, enforce facility width
      if (block.type === 'lane') {
        obj.set({
          width: facility.grid_width * cellSize,
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
        });
      } else {
        obj.set({
          width: newWidth,
          height: newHeight,
          scaleX: 1,
          scaleY: 1,
        });
      }

      // Update text position in the group
      const text = obj._objects?.[1];
      if (text) {
        text.set({
          left: (block.type === 'lane' ? facility.grid_width * cellSize : newWidth) / 2,
          top: newHeight / 2,
        });
      }

      canvas.renderAll();
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const gridX = Math.round((obj.left || 0) / cellSize);
      const gridY = Math.round((obj.top || 0) / cellSize);
      const gridWidth = Math.round((obj.width || 0) / cellSize);
      const gridHeight = Math.round((obj.height || 0) / cellSize);

      // Update the data reference so our object pool stays in sync
      obj.set({ data: { ...block, grid_x: gridX, grid_y: gridY, grid_width: gridWidth, grid_height: gridHeight } } as any);

      if (gridX !== block.grid_x || gridY !== block.grid_y) {
        onBlockMove(block.id, gridX, gridY);
      }

      if (gridWidth !== block.grid_width || gridHeight !== block.grid_height) {
        onBlockResize(block.id, gridWidth, gridHeight);
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
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth - 40;
    const containerHeight = containerRef.current.clientHeight - 100;
    
    const gridPixelWidth = facility.grid_width * cellSize;
    const gridPixelHeight = facility.grid_height * cellSize;
    
    const zoomX = containerWidth / gridPixelWidth;
    const zoomY = containerHeight / gridPixelHeight;
    
    const fitZoom = Math.min(zoomX, zoomY, 1); // Don't zoom in beyond 100%
    setZoom(Math.max(0.1, fitZoom)); // Minimum 10%
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
          vpt[4] += e.e.clientX - lastPosRef.current.x;
          vpt[5] += e.e.clientY - lastPosRef.current.y;
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
            <div><kbd className="px-1 py-0.5 bg-muted rounded">+/-</kbd> Zoom in/out</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">0</kbd> Reset zoom</div>
            <div><kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> Pan canvas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
