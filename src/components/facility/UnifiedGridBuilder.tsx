import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text as FabricText, Group, Line } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
}

interface Lane {
  id: string;
  name?: string;
  position_order?: number;
  grid_y?: number;
  grid_height?: number;
}

interface Station {
  id: string;
  name?: string;
  grid_x?: number;
  grid_y?: number;
  grid_width?: number;
  grid_height?: number;
}

type EditMode = 'facility' | 'gates' | 'lanes' | 'stations';

interface UnifiedGridBuilderProps {
  gridWidth: number;
  gridHeight: number;
  gates: Gate[];
  lanes?: Lane[];
  stations?: Station[];
  editMode: EditMode;
  onGateMove?: (gateId: string, gridX: number, gridY: number) => void;
  onLaneMove?: (laneId: string, gridX: number, gridY: number) => void;
  onStationMove?: (stationId: string, gridX: number, gridY: number) => void;
  onFacilityResize?: (gridWidth: number, gridHeight: number) => void;
  onGateResize?: (gateId: string, gridWidth: number, gridHeight: number) => void;
  onLaneResize?: (laneId: string, gridHeight: number) => void;
  onStationResize?: (stationId: string, gridWidth: number, gridHeight: number) => void;
  onElementSelect?: (element: { type: string; id: string; data: any }) => void;
}

const CELL_SIZE = 20;

const COLORS = {
  facility: {
    grid: 'rgba(255, 107, 107, 0.4)',
    background: '#FFFFFF',
    stroke: 'rgb(220, 38, 38)',
    strokeWidth: 2,
  },
  gates: {
    fill: 'rgba(16, 185, 129, 0.6)',
    stroke: 'rgb(5, 150, 105)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 4,
  },
  lanes: {
    fill: 'rgba(147, 51, 234, 0.4)',
    stroke: 'rgb(126, 34, 206)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 3,
  },
  stations: {
    fill: 'rgba(249, 115, 22, 0.7)',
    stroke: 'rgb(194, 65, 12)',
    text: 'rgb(255, 255, 255)',
    strokeWidth: 3,
  },
  selected: {
    stroke: 'rgb(59, 130, 246)',
    strokeWidth: 4,
  },
};

export function UnifiedGridBuilder({
  gridWidth,
  gridHeight,
  gates,
  lanes = [],
  stations = [],
  editMode,
  onGateMove,
  onLaneMove,
  onStationMove,
  onFacilityResize,
  onGateResize,
  onLaneResize,
  onStationResize,
  onElementSelect,
}: UnifiedGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 800 });
  
  // Store callbacks in refs to prevent useEffect re-runs
  const callbacksRef = useRef({
    onGateMove,
    onLaneMove,
    onStationMove,
    onFacilityResize,
    onGateResize,
    onLaneResize,
    onStationResize,
    onElementSelect,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onGateMove,
      onLaneMove,
      onStationMove,
      onFacilityResize,
      onGateResize,
      onLaneResize,
      onStationResize,
      onElementSelect,
    };
  });

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      const aspectRatio = gridHeight / gridWidth;
      const calculatedHeight = Math.min(width * aspectRatio, 800);
      setCanvasDimensions({ 
        width: Math.max(800, width - 40), 
        height: Math.max(600, calculatedHeight) 
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [gridWidth, gridHeight]);

  // Initialize canvas once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      backgroundColor: COLORS.facility.background,
      selection: false,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []); // Only create once

  // Update canvas size when dimensions change
  useEffect(() => {
    if (!canvas) return;
    canvas.setDimensions(canvasDimensions);
    canvas.renderAll();
  }, [canvas, canvasDimensions]);

  // Update selection mode when editMode changes
  useEffect(() => {
    if (!canvas) return;
    canvas.selection = editMode === 'facility';
  }, [canvas, editMode]);

  // Canvas-level event handlers for element interaction
  useEffect(() => {
    if (!canvas) return;

    const handleObjectMoving = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const { type } = obj.data;
      const left = obj.left || 0;
      const top = obj.top || 0;

      const snappedLeft = Math.round(left / CELL_SIZE) * CELL_SIZE;
      const snappedTop = Math.round(top / CELL_SIZE) * CELL_SIZE;

      if (type === 'lane') {
        obj.set({ left: 0, top: snappedTop });
      } else {
        obj.set({ left: snappedLeft, top: snappedTop });
      }
    };

    const handleObjectScaling = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const rect = obj._objects?.[0];
      const text = obj._objects?.[1];
      if (!rect) return;

      const scaleX = obj.scaleX || 1;
      const scaleY = obj.scaleY || 1;
      const baseWidth = rect.width || 0;
      const baseHeight = rect.height || 0;

      const newWidth = Math.round((baseWidth * scaleX) / CELL_SIZE) * CELL_SIZE;
      const newHeight = Math.round((baseHeight * scaleY) / CELL_SIZE) * CELL_SIZE;

      rect.set({ width: newWidth, height: newHeight });
      obj.set({ scaleX: 1, scaleY: 1 });

      if (text && obj.data.type === 'lane') {
        text.set({ top: newHeight / 2 - 7 });
      } else if (text && obj.data.type === 'gate') {
        text.set({ left: newWidth / 2 - 6 });
      } else if (text && obj.data.type === 'station') {
        text.set({ left: newWidth / 2 - 20, top: newHeight / 2 - 8 });
      }

      canvas.renderAll();
    };

    const handleObjectModified = (e: any) => {
      const obj = e.target;
      if (!obj?.data) return;

      const { type, id } = obj.data;
      const gridX = Math.round((obj.left || 0) / CELL_SIZE);
      const gridY = Math.round((obj.top || 0) / CELL_SIZE);

      const rect = obj._objects?.[0];
      const gridWidth = Math.round((rect?.width || 0) / CELL_SIZE);
      const gridHeight = Math.round((rect?.height || 0) / CELL_SIZE);

      if (type === 'gate') {
        callbacksRef.current.onGateMove?.(id, gridX, gridY);
        callbacksRef.current.onGateResize?.(id, gridWidth, gridHeight);
      } else if (type === 'lane') {
        callbacksRef.current.onLaneMove?.(id, 0, gridY);
        callbacksRef.current.onLaneResize?.(id, gridHeight);
      } else if (type === 'station') {
        callbacksRef.current.onStationMove?.(id, gridX, gridY);
        callbacksRef.current.onStationResize?.(id, gridWidth, gridHeight);
      }
    };

    const handleSelectionCreated = (e: any) => {
      const obj = e.selected?.[0];
      if (obj?.data) {
        callbacksRef.current.onElementSelect?.(obj.data);
      }
    };

    canvas.on('object:moving', handleObjectMoving);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);

    return () => {
      canvas.off('object:moving', handleObjectMoving);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
    };
  }, [canvas]);

  // Panning handlers
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      if (e.target && e.target !== canvas) return;
      
      if (e.e.altKey || e.e.button === 1) {
        setIsPanning(true);
        setLastPanPoint({ x: e.e.clientX, y: e.e.clientY });
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
      }
    };

    const handleMouseMove = (e: any) => {
      if (isPanning && lastPanPoint) {
        const delta = {
          x: e.e.clientX - lastPanPoint.x,
          y: e.e.clientY - lastPanPoint.y,
        };
        canvas.relativePan({ x: delta.x, y: delta.y } as any);
        setLastPanPoint({ x: e.e.clientX, y: e.e.clientY });
        canvas.defaultCursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setLastPanPoint(null);
      canvas.selection = editMode === 'facility';
      canvas.defaultCursor = 'default';
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, isPanning, lastPanPoint, editMode]);

  useEffect(() => {
    if (!canvas || !canvas.upperCanvasEl) return;

    canvas.clear();
    canvas.backgroundColor = COLORS.facility.background;

    // Draw facility boundary
    const facilityBoundary = new Rect({
      left: 0,
      top: 0,
      width: gridWidth * CELL_SIZE,
      height: gridHeight * CELL_SIZE,
      fill: 'transparent',
      stroke: COLORS.facility.stroke,
      strokeWidth: COLORS.facility.strokeWidth,
      selectable: editMode === 'facility',
      hasControls: editMode === 'facility',
      lockRotation: true,
      evented: editMode === 'facility',
      data: { type: 'facility', id: 'facility-boundary' },
    } as any);

    canvas.add(facilityBoundary);

    // Draw grid lines
    for (let i = 0; i <= gridWidth; i++) {
      const line = new Line([i * CELL_SIZE, 0, i * CELL_SIZE, gridHeight * CELL_SIZE], {
        stroke: COLORS.facility.grid,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    for (let i = 0; i <= gridHeight; i++) {
      const line = new Line([0, i * CELL_SIZE, gridWidth * CELL_SIZE, i * CELL_SIZE], {
        stroke: COLORS.facility.grid,
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Render lanes
    lanes.forEach((lane) => {
      const laneY = (lane.grid_y || 0) * CELL_SIZE;
      const laneHeight = (lane.grid_height || 5) * CELL_SIZE;
      const opacity = editMode === 'lanes' ? 1 : 0.3;

      const laneRect = new Rect({
        left: 0,
        top: 0,
        width: gridWidth * CELL_SIZE,
        height: laneHeight,
        fill: COLORS.lanes.fill,
        stroke: COLORS.lanes.stroke,
        strokeWidth: COLORS.lanes.strokeWidth,
        opacity,
      });

      const laneText = new FabricText(lane.name || `Lane ${lane.position_order}`, {
        left: 10,
        top: laneHeight / 2 - 7,
        fontSize: 16,
        fill: COLORS.lanes.text,
        fontWeight: 'bold',
      });

      const laneGroup = new Group([laneRect, laneText], {
        left: 0,
        top: laneY,
        selectable: editMode === 'lanes',
        hasControls: editMode === 'lanes',
        lockRotation: true,
        lockScalingX: true,
        lockMovementX: true,
        evented: editMode === 'lanes',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'lanes' ? 'move' : 'default',
        moveCursor: 'ns-resize',
        data: { type: 'lane', id: lane.id, originalData: lane },
      } as any);

      canvas.add(laneGroup);
    });

    // Render gates
    gates.forEach((gate) => {
      const gateX = (gate.grid_x || 0) * CELL_SIZE;
      const gateY = (gate.grid_y || 0) * CELL_SIZE;
      const gateWidth = (gate.grid_width || 3) * CELL_SIZE;
      const gateHeight = (gate.grid_height || 10) * CELL_SIZE;
      const opacity = editMode === 'gates' ? 1 : 0.3;

      const gateRect = new Rect({
        left: 0,
        top: 0,
        width: gateWidth,
        height: gateHeight,
        fill: COLORS.gates.fill,
        stroke: COLORS.gates.stroke,
        strokeWidth: COLORS.gates.strokeWidth,
        opacity,
      });

      const gateText = new FabricText(gate.name || 'Gate', {
        left: gateWidth / 2 - 6,
        top: 10,
        fontSize: 14,
        fill: COLORS.gates.text,
        fontWeight: 'bold',
        angle: 90,
      });

      const gateGroup = new Group([gateRect, gateText], {
        left: gateX,
        top: gateY,
        selectable: editMode === 'gates',
        hasControls: editMode === 'gates',
        lockRotation: true,
        evented: editMode === 'gates',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'gates' ? 'move' : 'default',
        moveCursor: 'move',
        data: { type: 'gate', id: gate.id, originalData: gate },
      } as any);

      canvas.add(gateGroup);
    });

    // Render stations
    stations.forEach((station) => {
      const stationX = (station.grid_x || 0) * CELL_SIZE;
      const stationY = (station.grid_y || 0) * CELL_SIZE;
      const stationWidth = (station.grid_width || 4) * CELL_SIZE;
      const stationHeight = (station.grid_height || 3) * CELL_SIZE;
      const opacity = editMode === 'stations' ? 1 : 0.3;

      const stationRect = new Rect({
        left: 0,
        top: 0,
        width: stationWidth,
        height: stationHeight,
        fill: COLORS.stations.fill,
        stroke: COLORS.stations.stroke,
        strokeWidth: COLORS.stations.strokeWidth,
        opacity,
        rx: 4,
        ry: 4,
      });

      const stationText = new FabricText(station.name || 'Station', {
        left: stationWidth / 2 - 20,
        top: stationHeight / 2 - 8,
        fontSize: 13,
        fill: COLORS.stations.text,
        fontWeight: 'bold',
      });

      const stationGroup = new Group([stationRect, stationText], {
        left: stationX,
        top: stationY,
        selectable: editMode === 'stations',
        hasControls: editMode === 'stations',
        lockRotation: true,
        evented: editMode === 'stations',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
        hoverCursor: editMode === 'stations' ? 'move' : 'default',
        moveCursor: 'move',
        data: { type: 'station', id: station.id, originalData: station },
      } as any);

      canvas.add(stationGroup);
    });

    canvas.renderAll();
  }, [canvas, gridWidth, gridHeight, gates, lanes, stations, editMode]);

  // Update element properties when editMode changes
  useEffect(() => {
    if (!canvas) return;

    canvas.getObjects().forEach((obj: any) => {
      if (obj.data) {
        const { type } = obj.data;
        
        if (type === 'gate') {
          obj.set({
            selectable: editMode === 'gates',
            evented: editMode === 'gates',
            hasControls: editMode === 'gates',
            opacity: editMode === 'gates' ? 1 : 0.3,
            hoverCursor: editMode === 'gates' ? 'move' : 'default',
          });
          const rect = obj._objects?.[0];
          if (rect) rect.set({ opacity: editMode === 'gates' ? 1 : 0.3 });
        } else if (type === 'lane') {
          obj.set({
            selectable: editMode === 'lanes',
            evented: editMode === 'lanes',
            hasControls: editMode === 'lanes',
            opacity: editMode === 'lanes' ? 1 : 0.3,
            hoverCursor: editMode === 'lanes' ? 'move' : 'default',
          });
          const rect = obj._objects?.[0];
          if (rect) rect.set({ opacity: editMode === 'lanes' ? 1 : 0.3 });
        } else if (type === 'station') {
          obj.set({
            selectable: editMode === 'stations',
            evented: editMode === 'stations',
            hasControls: editMode === 'stations',
            opacity: editMode === 'stations' ? 1 : 0.3,
            hoverCursor: editMode === 'stations' ? 'move' : 'default',
          });
          const rect = obj._objects?.[0];
          if (rect) rect.set({ opacity: editMode === 'stations' ? 1 : 0.3 });
        }
      }
    });

    canvas.renderAll();
  }, [canvas, editMode]);

  const handleZoomIn = () => {
    if (canvas) {
      const newZoom = Math.min(zoom + 0.2, 3);
      canvas.setZoom(newZoom);
      setZoom(newZoom);
      canvas.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (canvas) {
      const newZoom = Math.max(zoom - 0.2, 0.5);
      canvas.setZoom(newZoom);
      setZoom(newZoom);
      canvas.renderAll();
    }
  };

  const handleResetZoom = () => {
    if (canvas) {
      canvas.setZoom(1);
      canvas.viewportTransform = [1, 0, 0, 1, 100, 100];
      setZoom(1);
      canvas.renderAll();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetZoom}>
          Reset ({Math.round(zoom * 100)}%)
        </Button>
      </div>
      <div className="text-xs text-muted-foreground mb-2">
        💡 Hold Alt or middle-click to pan • Click and drag to move elements • Use handles to resize
      </div>
      <div className="overflow-auto border border-border rounded-lg shadow-lg bg-background">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
