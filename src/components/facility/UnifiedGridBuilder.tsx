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
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1000;

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
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: COLORS.facility.background,
      selection: false,
    });

    fabricCanvas.viewportTransform = [1, 0, 0, 1, 100, 100];
    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []); // Only create once

  // Update selection mode when editMode changes
  useEffect(() => {
    if (!canvas) return;
    canvas.selection = editMode === 'facility';
  }, [canvas, editMode]);

  // Panning handlers
  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (e: any) => {
      // Don't start panning if clicking on an object
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
    });

    if (editMode === 'facility' && onFacilityResize) {
      facilityBoundary.on('scaling', () => {
        const scaleX = facilityBoundary.scaleX || 1;
        const scaleY = facilityBoundary.scaleY || 1;
        facilityBoundary.set({
          width: Math.round((gridWidth * CELL_SIZE * scaleX) / CELL_SIZE) * CELL_SIZE,
          height: Math.round((gridHeight * CELL_SIZE * scaleY) / CELL_SIZE) * CELL_SIZE,
          scaleX: 1,
          scaleY: 1,
        });
        canvas.renderAll();
      });

      facilityBoundary.on('modified', () => {
        const newGridWidth = Math.round((facilityBoundary.width || 0) / CELL_SIZE);
        const newGridHeight = Math.round((facilityBoundary.height || 0) / CELL_SIZE);
        onFacilityResize(Math.max(10, newGridWidth), Math.max(10, newGridHeight));
      });
    }

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
        top: laneY,
        width: gridWidth * CELL_SIZE,
        height: laneHeight,
        fill: COLORS.lanes.fill,
        stroke: COLORS.lanes.stroke,
        strokeWidth: COLORS.lanes.strokeWidth,
        opacity,
        selectable: false,
        evented: false,
      });

      const laneText = new FabricText(lane.name || `Lane ${lane.position_order}`, {
        left: 10,
        top: laneY + laneHeight / 2 - 7,
        fontSize: 16,
        fill: COLORS.lanes.text,
        fontWeight: 'bold',
        selectable: false,
        evented: false,
      });

      const laneGroup = new Group([laneRect, laneText], {
        selectable: editMode === 'lanes',
        hasControls: editMode === 'lanes',
        lockRotation: true,
        lockScalingX: true,
        evented: editMode === 'lanes',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
      });

      if (editMode === 'lanes') {
        laneGroup.on('moving', () => {
          const top = laneGroup.top || 0;
          const snappedTop = Math.round(top / CELL_SIZE) * CELL_SIZE;
          laneGroup.set({ top: snappedTop, left: 0 });
        });

        laneGroup.on('scaling', () => {
          const scaleY = laneGroup.scaleY || 1;
          const newHeight = Math.round((laneHeight * scaleY) / CELL_SIZE) * CELL_SIZE;
          laneRect.set({ height: newHeight });
          laneGroup.set({ scaleY: 1 });
          laneText.set({ top: newHeight / 2 - 7 });
          canvas.renderAll();
        });

        laneGroup.on('modified', () => {
          const gridY = Math.round((laneGroup.top || 0) / CELL_SIZE);
          const gridHeight = Math.round((laneRect.height || 0) / CELL_SIZE);
          if (onLaneMove) onLaneMove(lane.id, 0, gridY);
          if (onLaneResize) onLaneResize(lane.id, gridHeight);
        });

        laneGroup.on('selected', () => {
          if (onElementSelect) {
            onElementSelect({ type: 'lane', id: lane.id, data: lane });
          }
        });
      }

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
        left: gateX,
        top: gateY,
        width: gateWidth,
        height: gateHeight,
        fill: COLORS.gates.fill,
        stroke: COLORS.gates.stroke,
        strokeWidth: COLORS.gates.strokeWidth,
        opacity,
        selectable: false,
        evented: false,
      });

      const gateText = new FabricText(gate.name || 'Gate', {
        left: gateX + gateWidth / 2 - 6,
        top: gateY + 10,
        fontSize: 14,
        fill: COLORS.gates.text,
        fontWeight: 'bold',
        angle: 90,
        selectable: false,
        evented: false,
      });

      const gateGroup = new Group([gateRect, gateText], {
        selectable: editMode === 'gates',
        hasControls: editMode === 'gates',
        lockRotation: true,
        evented: editMode === 'gates',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
      });

      if (editMode === 'gates') {
        gateGroup.on('moving', () => {
          const left = gateGroup.left || 0;
          const top = gateGroup.top || 0;
          const snappedLeft = Math.round(left / CELL_SIZE) * CELL_SIZE;
          const snappedTop = Math.round(top / CELL_SIZE) * CELL_SIZE;
          gateGroup.set({ left: snappedLeft, top: snappedTop });
        });

        gateGroup.on('scaling', () => {
          const scaleX = gateGroup.scaleX || 1;
          const scaleY = gateGroup.scaleY || 1;
          const newWidth = Math.round((gateWidth * scaleX) / CELL_SIZE) * CELL_SIZE;
          const newHeight = Math.round((gateHeight * scaleY) / CELL_SIZE) * CELL_SIZE;
          gateRect.set({ width: newWidth, height: newHeight });
          gateGroup.set({ scaleX: 1, scaleY: 1 });
          gateText.set({ left: newWidth / 2 - 6 });
          canvas.renderAll();
        });

        gateGroup.on('modified', () => {
          const gridX = Math.round((gateGroup.left || 0) / CELL_SIZE);
          const gridY = Math.round((gateGroup.top || 0) / CELL_SIZE);
          const gridWidth = Math.round((gateRect.width || 0) / CELL_SIZE);
          const gridHeight = Math.round((gateRect.height || 0) / CELL_SIZE);
          if (onGateMove) onGateMove(gate.id, gridX, gridY);
          if (onGateResize) onGateResize(gate.id, gridWidth, gridHeight);
        });

        gateGroup.on('selected', () => {
          if (onElementSelect) {
            onElementSelect({ type: 'gate', id: gate.id, data: gate });
          }
        });
      }

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
        left: stationX,
        top: stationY,
        width: stationWidth,
        height: stationHeight,
        fill: COLORS.stations.fill,
        stroke: COLORS.stations.stroke,
        strokeWidth: COLORS.stations.strokeWidth,
        opacity,
        rx: 4,
        ry: 4,
        selectable: false,
        evented: false,
      });

      const stationText = new FabricText(station.name || 'Station', {
        left: stationX + stationWidth / 2 - 20,
        top: stationY + stationHeight / 2 - 8,
        fontSize: 13,
        fill: COLORS.stations.text,
        fontWeight: 'bold',
        selectable: false,
        evented: false,
      });

      const stationGroup = new Group([stationRect, stationText], {
        selectable: editMode === 'stations',
        hasControls: editMode === 'stations',
        lockRotation: true,
        evented: editMode === 'stations',
        cornerStyle: 'circle',
        borderColor: COLORS.selected.stroke,
        cornerColor: COLORS.selected.stroke,
      });

      if (editMode === 'stations') {
        stationGroup.on('moving', () => {
          const left = stationGroup.left || 0;
          const top = stationGroup.top || 0;
          const snappedLeft = Math.round(left / CELL_SIZE) * CELL_SIZE;
          const snappedTop = Math.round(top / CELL_SIZE) * CELL_SIZE;
          stationGroup.set({ left: snappedLeft, top: snappedTop });
        });

        stationGroup.on('scaling', () => {
          const scaleX = stationGroup.scaleX || 1;
          const scaleY = stationGroup.scaleY || 1;
          const newWidth = Math.round((stationWidth * scaleX) / CELL_SIZE) * CELL_SIZE;
          const newHeight = Math.round((stationHeight * scaleY) / CELL_SIZE) * CELL_SIZE;
          stationRect.set({ width: newWidth, height: newHeight });
          stationGroup.set({ scaleX: 1, scaleY: 1 });
          stationText.set({ left: newWidth / 2 - 20, top: newHeight / 2 - 8 });
          canvas.renderAll();
        });

        stationGroup.on('modified', () => {
          const gridX = Math.round((stationGroup.left || 0) / CELL_SIZE);
          const gridY = Math.round((stationGroup.top || 0) / CELL_SIZE);
          const gridWidth = Math.round((stationRect.width || 0) / CELL_SIZE);
          const gridHeight = Math.round((stationRect.height || 0) / CELL_SIZE);
          if (onStationMove) onStationMove(station.id, gridX, gridY);
          if (onStationResize) onStationResize(station.id, gridWidth, gridHeight);
        });

        stationGroup.on('selected', () => {
          if (onElementSelect) {
            onElementSelect({ type: 'station', id: station.id, data: station });
          }
        });
      }

      canvas.add(stationGroup);
    });

    canvas.renderAll();
  }, [canvas, gridWidth, gridHeight, gates, lanes, stations, editMode, onGateMove, onLaneMove, onStationMove, onFacilityResize, onGateResize, onLaneResize, onStationResize, onElementSelect]);

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
    <div className="relative">
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
      <canvas ref={canvasRef} className="border border-border rounded-lg shadow-lg" />
    </div>
  );
}
