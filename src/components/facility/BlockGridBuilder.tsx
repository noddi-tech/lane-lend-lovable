import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3 } from 'lucide-react';

export type EditMode = 'view' | 'facility' | 'gate' | 'lane' | 'station';

export interface LayoutBlock {
  id: string;
  type: 'facility' | 'gate' | 'lane' | 'station';
  name: string;
  grid_x: number;
  grid_y: number;
  grid_width: number;
  grid_height: number;
  parent_id?: string;
}

interface BlockGridBuilderProps {
  facility: LayoutBlock;
  gates: LayoutBlock[];
  lanes: LayoutBlock[];
  stations: LayoutBlock[];
  editMode: EditMode;
  onBlockMove: (blockId: string, gridX: number, gridY: number) => void;
  onBlockResize: (blockId: string, gridWidth: number, gridHeight: number) => void;
  onBlockSelect: (block: LayoutBlock | null) => void;
}

const CELL_SIZE = 15;

const COLORS = {
  facility: { fill: 'rgba(59, 130, 246, 0.1)', stroke: '#3b82f6', text: '#3b82f6' },
  gate: { fill: 'rgba(34, 197, 94, 0.2)', stroke: '#22c55e', text: '#22c55e' },
  lane: { fill: 'rgba(168, 85, 247, 0.2)', stroke: '#a855f7', text: '#a855f7' },
  station: { fill: 'rgba(251, 146, 60, 0.25)', stroke: '#fb923c', text: '#fb923c' },
};

export function BlockGridBuilder({
  facility,
  gates,
  lanes,
  stations,
  editMode,
  onBlockMove,
  onBlockResize,
  onBlockSelect,
}: BlockGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1000, height: 700 });
  
  // Object pool pattern refs
  const objectPoolRef = useRef<Map<string, Group>>(new Map());
  const isDraggingRef = useRef(false);
  const lastDataHashRef = useRef<string>('');

  // Calculate responsive canvas size
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const aspectRatio = facility.grid_height / facility.grid_width;
      const height = Math.min(width * aspectRatio, 700);
      setCanvasDimensions({ width: Math.min(width - 40, 1200), height });
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
  const generateDataHash = (gates: LayoutBlock[], lanes: LayoutBlock[], stations: LayoutBlock[]) => {
    return JSON.stringify({
      gates: gates.map(g => `${g.id}-${g.grid_x}-${g.grid_y}-${g.grid_width}-${g.grid_height}`),
      lanes: lanes.map(l => `${l.id}-${l.grid_x}-${l.grid_y}-${l.grid_width}-${l.grid_height}`),
      stations: stations.map(s => `${s.id}-${s.grid_x}-${s.grid_y}-${s.grid_width}-${s.grid_height}`),
    });
  };

  // Helper: Update existing object without destroying it
  const updateBlockObject = (group: Group, block: LayoutBlock) => {
    group.set({
      left: block.grid_x * CELL_SIZE,
      top: block.grid_y * CELL_SIZE,
    });
    
    // Update rect dimensions
    const rect = group._objects?.[0] as Rect;
    if (rect) {
      rect.set({
        width: block.grid_width * CELL_SIZE,
        height: block.grid_height * CELL_SIZE,
      });
    }
    
    // Update text
    const text = group._objects?.[1] as Text;
    if (text) {
      text.set({
        text: block.name,
        left: (block.grid_width * CELL_SIZE) / 2,
        top: (block.grid_height * CELL_SIZE) / 2,
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
    const currentHash = generateDataHash(gates, lanes, stations);
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
      return block && (block.type === 'gate' || block.type === 'lane' || block.type === 'station');
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
          left: i * CELL_SIZE,
          top: 0,
          width: 1,
          height: facility.grid_height * CELL_SIZE,
          fill: 'rgba(255, 255, 255, 0.05)',
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }

      for (let j = 0; j <= facility.grid_height; j++) {
        const line = new Rect({
          left: 0,
          top: j * CELL_SIZE,
          width: facility.grid_width * CELL_SIZE,
          height: 1,
          fill: 'rgba(255, 255, 255, 0.05)',
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    }

    // Draw facility boundary
    const facilityRect = new Rect({
      left: 0,
      top: 0,
      width: facility.grid_width * CELL_SIZE,
      height: facility.grid_height * CELL_SIZE,
      fill: COLORS.facility.fill,
      stroke: COLORS.facility.stroke,
      strokeWidth: 3,
      selectable: false,
      hasControls: false,
      lockRotation: true,
      evented: false,
      rx: 4,
      ry: 4,
    });

    facilityRect.set({ data: { ...facility, type: 'facility' } } as any);
    canvas.add(facilityRect);

    // Helper to create new block
    const createBlock = (block: LayoutBlock) => {
      const isEditable = block.type === editMode;
      const isLane = block.type === 'lane';
      
      const rect = new Rect({
        left: 0,
        top: 0,
        width: block.grid_width * CELL_SIZE,
        height: block.grid_height * CELL_SIZE,
        fill: COLORS[block.type].fill,
        stroke: COLORS[block.type].stroke,
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      });

      const text = new Text(block.name, {
        left: (block.grid_width * CELL_SIZE) / 2,
        top: (block.grid_height * CELL_SIZE) / 2,
        fontSize: Math.max(10, Math.min(14, block.grid_width)),
        fill: COLORS[block.type].text,
        originX: 'center',
        originY: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
      });

      const group = new Group([rect, text], {
        left: block.grid_x * CELL_SIZE,
        top: block.grid_y * CELL_SIZE,
        selectable: isEditable,
        hasControls: isEditable && !isLane,
        lockRotation: true,
        evented: isEditable,
        hoverCursor: isEditable ? 'move' : 'default',
        lockMovementX: !isEditable || isLane,
        lockMovementY: !isEditable,
        lockScalingX: !isEditable || isLane,
        lockScalingY: !isEditable,
        opacity: isEditable ? 1 : (block.type === 'facility' ? 1 : 0.5),
        subTargetCheck: false,
      });

      group.set({ data: block } as any);
      return group;
    };

    // Process blocks: Update existing or create new
    const allBlocks = [...lanes, ...gates, ...stations];
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
        
        existing.set({
          selectable: isEditable,
          evented: isEditable,
          hasControls: isEditable && !isLane,
          hoverCursor: isEditable ? 'move' : 'default',
          lockMovementX: !isEditable || isLane,
          lockMovementY: !isEditable,
          lockScalingX: !isEditable || isLane,
          lockScalingY: !isEditable,
          opacity: isEditable ? 1 : (block.type === 'facility' ? 1 : 0.5),
        });
        
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
    
    canvas.renderAll();
  }, [canvas, facility, gates, lanes, stations, showGrid, editMode, generateDataHash, updateBlockObject]);

  // Handle object interactions
  useEffect(() => {
    if (!canvas) return;

    const handleObjectMoving = (e: any) => {
      isDraggingRef.current = true; // Mark drag as active
      
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const left = obj.left || 0;
      const top = obj.top || 0;

      // Snap to grid
      let snappedX = Math.round(left / CELL_SIZE);
      let snappedY = Math.round(top / CELL_SIZE);

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
          top: snappedY * CELL_SIZE,
        });
      } else {
        obj.set({
          left: snappedX * CELL_SIZE,
          top: snappedY * CELL_SIZE,
        });
      }

      // Constrain to facility bounds (for non-station blocks)
      if (block.type !== 'station') {
        const maxX = facility.grid_width - block.grid_width;
        const maxY = facility.grid_height - block.grid_height;

        if (snappedX < 0) obj.set({ left: 0 });
        if (snappedY < 0) obj.set({ top: 0 });
        if (snappedX > maxX) obj.set({ left: maxX * CELL_SIZE });
        if (snappedY > maxY) obj.set({ top: maxY * CELL_SIZE });
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
        CELL_SIZE * 2,
        Math.round(currentWidth / CELL_SIZE) * CELL_SIZE
      );
      const newHeight = Math.max(
        CELL_SIZE * 2,
        Math.round(currentHeight / CELL_SIZE) * CELL_SIZE
      );

      // For lanes, enforce facility width
      if (block.type === 'lane') {
        obj.set({
          width: facility.grid_width * CELL_SIZE,
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
          left: (block.type === 'lane' ? facility.grid_width * CELL_SIZE : newWidth) / 2,
          top: newHeight / 2,
        });
      }

      canvas.renderAll();
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const gridX = Math.round((obj.left || 0) / CELL_SIZE);
      const gridY = Math.round((obj.top || 0) / CELL_SIZE);
      const gridWidth = Math.round((obj.width || 0) / CELL_SIZE);
      const gridHeight = Math.round((obj.height || 0) / CELL_SIZE);

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
  }, [canvas, facility, onBlockMove, onBlockResize, onBlockSelect]);


  const handleZoomIn = () => {
    if (!canvas) return;
    const newZoom = Math.min(zoom + 0.2, 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!canvas) return;
    const newZoom = Math.max(zoom - 0.2, 0.5);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  };

  const handleResetZoom = () => {
    if (!canvas) return;
    setZoom(1);
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetZoom}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant={showGrid ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto bg-card">
        <canvas ref={canvasRef} />
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.gate.stroke, backgroundColor: COLORS.gate.fill }} />
          <span className="text-muted-foreground">Gates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.lane.stroke, backgroundColor: COLORS.lane.fill }} />
          <span className="text-muted-foreground">Lanes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2" style={{ borderColor: COLORS.station.stroke, backgroundColor: COLORS.station.fill }} />
          <span className="text-muted-foreground">Stations</span>
        </div>
      </div>
    </div>
  );
}
