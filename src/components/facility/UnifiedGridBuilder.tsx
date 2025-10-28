import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Gate {
  id: string;
  name: string;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
}

interface Lane {
  id: string;
  name: string;
  grid_position_y: number;
  grid_height: number;
}

interface Station {
  id: string;
  name: string;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  lane_id: string;
}

type EditMode = 'facility' | 'gates' | 'lanes' | 'stations';

interface UnifiedGridBuilderProps {
  gridWidth: number;
  gridHeight: number;
  gates: Gate[];
  lanes: Lane[];
  stations: Station[];
  editMode: EditMode;
  onGateMove?: (gateId: string, x: number, y: number) => void;
  onLaneMove?: (laneId: string, y: number) => void;
  onStationMove?: (stationId: string, x: number, y: number) => void;
  onFacilityResize?: (width: number, height: number) => void;
}

const CELL_SIZE = 20;
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

// Color constants using direct RGB values (Fabric.js doesn't support CSS variables in canvas)
const COLORS = {
  facility: {
    grid: 'rgb(255, 107, 107)',
    background: 'rgb(255, 245, 245)',
    stroke: 'rgb(255, 107, 107)',
  },
  gates: {
    fill: 'rgba(16, 185, 129, 0.3)',
    stroke: 'rgb(16, 185, 129)',
    text: 'rgb(5, 150, 105)',
  },
  lanes: {
    fill: 'rgba(139, 92, 246, 0.2)',
    stroke: 'rgb(139, 92, 246)',
    text: 'rgb(124, 58, 237)',
  },
  stations: {
    fill: 'rgba(196, 181, 253, 0.4)',
    stroke: 'rgb(196, 181, 253)',
    text: 'rgb(167, 139, 250)',
  },
};

export function UnifiedGridBuilder({
  gridWidth,
  gridHeight,
  gates,
  lanes,
  stations,
  editMode,
  onGateMove,
  onLaneMove,
  onStationMove,
  onFacilityResize,
}: UnifiedGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: COLORS.facility.background,
      selection: false,
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = COLORS.facility.background;

    // Draw grid
    const maxX = Math.min(gridWidth, Math.floor(CANVAS_WIDTH / CELL_SIZE));
    const maxY = Math.min(gridHeight, Math.floor(CANVAS_HEIGHT / CELL_SIZE));

    for (let x = 0; x <= maxX; x++) {
      const line = new Rect({
        left: x * CELL_SIZE,
        top: 0,
        width: 1,
        height: maxY * CELL_SIZE,
        fill: COLORS.facility.grid,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    for (let y = 0; y <= maxY; y++) {
      const line = new Rect({
        left: 0,
        top: y * CELL_SIZE,
        width: maxX * CELL_SIZE,
        height: 1,
        fill: COLORS.facility.grid,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
    }

    // Draw lanes first (horizontal bands)
    lanes.forEach((lane) => {
      const isEditable = editMode === 'lanes';
      const opacity = editMode === 'facility' || editMode === 'gates' ? 0.3 : 1;

      const laneRect = new Rect({
        left: 0,
        top: lane.grid_position_y * CELL_SIZE,
        width: maxX * CELL_SIZE,
        height: lane.grid_height * CELL_SIZE,
        fill: COLORS.lanes.fill,
        stroke: COLORS.lanes.stroke,
        strokeWidth: 2,
        opacity,
      });

      const laneText = new Text(lane.name, {
        left: 10,
        top: lane.grid_position_y * CELL_SIZE + 5,
        fontSize: 14,
        fill: COLORS.lanes.text,
        fontWeight: 'bold',
        opacity,
      });

      const laneGroup = new Group([laneRect, laneText], {
        selectable: isEditable,
        hasControls: false,
        hasBorders: isEditable,
        lockRotation: true,
        lockScalingX: true,
        lockMovementX: true,
        hoverCursor: isEditable ? 'move' : 'default',
      });

      laneGroup.set('data', { laneId: lane.id });

      if (isEditable && onLaneMove) {
        laneGroup.on('modified', () => {
          const top = laneGroup.top || 0;
          const snappedY = Math.round(top / CELL_SIZE);

          laneGroup.set({
            left: 0,
            top: snappedY * CELL_SIZE,
          });

          canvas.renderAll();
          onLaneMove(lane.id, snappedY);
        });
      }

      canvas.add(laneGroup);
    });

    // Draw gates (thin vertical bars at edges)
    gates.forEach((gate) => {
      const isEditable = editMode === 'gates';
      const opacity = editMode === 'facility' ? 0.3 : 1;
      const gateWidth = 3; // Thin vertical bar

      const gateRect = new Rect({
        left: gate.grid_position_x * CELL_SIZE,
        top: gate.grid_position_y * CELL_SIZE,
        width: gateWidth * CELL_SIZE,
        height: gate.grid_height * CELL_SIZE,
        fill: COLORS.gates.fill,
        stroke: COLORS.gates.stroke,
        strokeWidth: 3,
        opacity,
      });

      const gateText = new Text(gate.name, {
        left: gate.grid_position_x * CELL_SIZE + 5,
        top: gate.grid_position_y * CELL_SIZE + 5,
        fontSize: 12,
        fill: COLORS.gates.text,
        fontWeight: 'bold',
        opacity,
      });

      const gateGroup = new Group([gateRect, gateText], {
        selectable: isEditable,
        hasControls: false,
        hasBorders: isEditable,
        lockRotation: true,
        hoverCursor: isEditable ? 'move' : 'default',
      });

      gateGroup.set('data', { gateId: gate.id });

      if (isEditable && onGateMove) {
        gateGroup.on('modified', () => {
          const left = gateGroup.left || 0;
          const top = gateGroup.top || 0;

          const snappedX = Math.round(left / CELL_SIZE);
          const snappedY = Math.round(top / CELL_SIZE);

          gateGroup.set({
            left: snappedX * CELL_SIZE,
            top: snappedY * CELL_SIZE,
          });

          canvas.renderAll();
          onGateMove(gate.id, snappedX, snappedY);
        });
      }

      canvas.add(gateGroup);
    });


    // Draw stations
    stations.forEach((station) => {
      const isEditable = editMode === 'stations';
      const opacity = editMode !== 'stations' ? 0.3 : 1;

      const stationRect = new Rect({
        left: station.grid_position_x * CELL_SIZE,
        top: station.grid_position_y * CELL_SIZE,
        width: station.grid_width * CELL_SIZE,
        height: station.grid_height * CELL_SIZE,
        fill: COLORS.stations.fill,
        stroke: COLORS.stations.stroke,
        strokeWidth: 2,
        rx: 2,
        ry: 2,
        opacity,
      });

      const stationText = new Text(station.name, {
        left: station.grid_position_x * CELL_SIZE + (station.grid_width * CELL_SIZE) / 2,
        top: station.grid_position_y * CELL_SIZE + (station.grid_height * CELL_SIZE) / 2,
        fontSize: 10,
        fill: COLORS.stations.text,
        originX: 'center',
        originY: 'center',
        opacity,
      });

      const stationGroup = new Group([stationRect, stationText], {
        selectable: isEditable,
        hasControls: false,
        hasBorders: isEditable,
        lockRotation: true,
        hoverCursor: isEditable ? 'move' : 'default',
      });

      stationGroup.set('data', { stationId: station.id });

      if (isEditable && onStationMove) {
        stationGroup.on('modified', () => {
          const left = stationGroup.left || 0;
          const top = stationGroup.top || 0;

          const snappedX = Math.round(left / CELL_SIZE);
          const snappedY = Math.round(top / CELL_SIZE);

          stationGroup.set({
            left: snappedX * CELL_SIZE,
            top: snappedY * CELL_SIZE,
          });

          canvas.renderAll();
          onStationMove(station.id, snappedX, snappedY);
        });
      }

      canvas.add(stationGroup);
    });

    canvas.renderAll();
  }, [canvas, gridWidth, gridHeight, gates, lanes, stations, editMode, onGateMove, onLaneMove, onStationMove, onFacilityResize]);

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
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4 mr-1" />
          Zoom In
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4 mr-1" />
          Zoom Out
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetZoom}>
          <Maximize2 className="h-4 w-4 mr-1" />
          Reset
        </Button>
        <span className="text-sm text-muted-foreground self-center ml-2">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>

      <div className="border-2 border-border rounded-lg overflow-hidden">
        <canvas ref={canvasRef} />
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Tip: Select an edit mode above to drag and reposition elements. Non-active layers are dimmed.
      </p>
    </div>
  );
}
