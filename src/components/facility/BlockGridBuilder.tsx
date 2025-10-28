import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Move } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  const [isPanning, setIsPanning] = useState(false);
  const [lastPosX, setLastPosX] = useState(0);
  const [lastPosY, setLastPosY] = useState(0);

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

  // Draw grid and blocks (render objects ONLY when data changes)
  useEffect(() => {
    if (!canvas) return;

    canvas.clear();
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

    // Helper to create block
    const createBlock = (block: LayoutBlock) => {
      const rect = new Rect({
        left: block.grid_x * CELL_SIZE,
        top: block.grid_y * CELL_SIZE,
        width: block.grid_width * CELL_SIZE,
        height: block.grid_height * CELL_SIZE,
        fill: COLORS[block.type].fill,
        stroke: COLORS[block.type].stroke,
        strokeWidth: 2,
        selectable: false,
        hasControls: false,
        lockRotation: true,
        evented: false,
        hoverCursor: 'default',
        rx: 4,
        ry: 4,
      });

      const text = new Text(block.name, {
        left: block.grid_x * CELL_SIZE + (block.grid_width * CELL_SIZE) / 2,
        top: block.grid_y * CELL_SIZE + (block.grid_height * CELL_SIZE) / 2,
        fontSize: Math.max(10, Math.min(14, block.grid_width)),
        fill: COLORS[block.type].text,
        originX: 'center',
        originY: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontWeight: 'bold',
        selectable: false,
        evented: false,
      });

      rect.set({ data: block } as any);
      canvas.add(rect);
      canvas.add(text);

      return { rect, text };
    };

    // Draw gates
    gates.forEach((gate) => {
      createBlock(gate);
    });

    // Draw lanes
    lanes.forEach((lane) => {
      createBlock(lane);
    });

    // Draw stations
    stations.forEach((station) => {
      createBlock(station);
    });

    canvas.renderAll();
  }, [canvas, facility, gates, lanes, stations, showGrid]); // NO editMode!

  // Update interactivity when editMode changes (don't redraw, just update properties)
  useEffect(() => {
    if (!canvas) return;

    canvas.getObjects().forEach((obj: any) => {
      if (!obj.data || !obj.data.type) return;

      const block = obj.data as LayoutBlock;
      const isEditable = block.type === editMode;

      obj.set({
        selectable: isEditable,
        evented: isEditable,
        hasControls: false,
        lockMovementX: !isEditable,
        lockMovementY: !isEditable,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        hoverCursor: isEditable ? 'move' : 'default',
        opacity: isEditable ? 1 : (block.type === 'facility' ? 1 : 0.5),
      });
    });

    canvas.renderAll();
  }, [canvas, editMode]);

  // Handle object interactions
  useEffect(() => {
    if (!canvas) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const left = obj.left || 0;
      const top = obj.top || 0;

      // Snap to grid
      const snappedX = Math.round(left / CELL_SIZE);
      const snappedY = Math.round(top / CELL_SIZE);

      obj.set({
        left: snappedX * CELL_SIZE,
        top: snappedY * CELL_SIZE,
      });

      // Constrain to facility bounds
      const maxX = facility.grid_width - block.grid_width;
      const maxY = facility.grid_height - block.grid_height;

      if (snappedX < 0) obj.set({ left: 0 });
      if (snappedY < 0) obj.set({ top: 0 });
      if (snappedX > maxX) obj.set({ left: maxX * CELL_SIZE });
      if (snappedY > maxY) obj.set({ top: maxY * CELL_SIZE });
    };

    const handleObjectScaling = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;

      const newWidth = Math.round((obj.width || 0) * scaleX / CELL_SIZE) * CELL_SIZE;
      const newHeight = Math.round((obj.height || 0) * scaleY / CELL_SIZE) * CELL_SIZE;

      obj.set({
        width: Math.max(CELL_SIZE * 2, newWidth),
        height: Math.max(CELL_SIZE * 2, newHeight),
        scaleX: 1,
        scaleY: 1,
      });
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const block = obj.data as LayoutBlock;
      const gridX = Math.round((obj.left || 0) / CELL_SIZE);
      const gridY = Math.round((obj.top || 0) / CELL_SIZE);
      const gridWidth = Math.round((obj.width || 0) / CELL_SIZE);
      const gridHeight = Math.round((obj.height || 0) / CELL_SIZE);

      if (gridX !== block.grid_x || gridY !== block.grid_y) {
        onBlockMove(block.id, gridX, gridY);
      }

      if (gridWidth !== block.grid_width || gridHeight !== block.grid_height) {
        onBlockResize(block.id, gridWidth, gridHeight);
      }
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

  // Panning
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      if (e.e.altKey) {
        setIsPanning(true);
        setLastPosX(e.e.clientX);
        setLastPosY(e.e.clientY);
        canvas.selection = false;
      }
    };

    const handleMouseMove = (e: any) => {
      if (isPanning) {
        const deltaX = e.e.clientX - lastPosX;
        const deltaY = e.e.clientY - lastPosY;
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          canvas.requestRenderAll();
        }
        setLastPosX(e.e.clientX);
        setLastPosY(e.e.clientY);
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
  }, [canvas, isPanning, lastPosX, lastPosY]);

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
          <Badge variant="outline" className="gap-1">
            <Move className="h-3 w-3" />
            Hold Alt to Pan
          </Badge>
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
