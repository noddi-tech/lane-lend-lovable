import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Text, FabricObject } from 'fabric';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  grid_position_x: number;
  grid_position_y: number;
  grid_width: number;
  grid_height: number;
  lane_id: string;
}

interface Lane {
  id: string;
  name: string;
  grid_position_y: number;
  grid_height: number;
}

interface GridBuilderProps {
  gridWidth: number;
  gridHeight: number;
  lanes: Lane[];
  stations: Station[];
  onStationMove: (stationId: string, x: number, y: number) => void;
}

const CELL_SIZE = 40;
const GRID_PADDING = 20;

export const GridBuilder = ({
  gridWidth,
  gridHeight,
  lanes,
  stations,
  onStationMove,
}: GridBuilderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvasWidth = gridWidth * CELL_SIZE + GRID_PADDING * 2;
    const canvasHeight = gridHeight * CELL_SIZE + GRID_PADDING * 2;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: 'hsl(var(--background))',
      selection: false,
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [gridWidth, gridHeight]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'hsl(var(--background))';

    // Draw grid
    for (let x = 0; x <= gridWidth; x++) {
      const line = new Rect({
        left: GRID_PADDING + x * CELL_SIZE,
        top: GRID_PADDING,
        width: 1,
        height: gridHeight * CELL_SIZE,
        fill: 'hsl(var(--border))',
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(line);
    }

    for (let y = 0; y <= gridHeight; y++) {
      const line = new Rect({
        left: GRID_PADDING,
        top: GRID_PADDING + y * CELL_SIZE,
        width: gridWidth * CELL_SIZE,
        height: 1,
        fill: 'hsl(var(--border))',
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(line);
    }

    // Draw lanes
    lanes.forEach((lane) => {
      const laneRect = new Rect({
        left: GRID_PADDING,
        top: GRID_PADDING + lane.grid_position_y * CELL_SIZE,
        width: gridWidth * CELL_SIZE,
        height: lane.grid_height * CELL_SIZE,
        fill: 'hsl(var(--primary) / 0.1)',
        stroke: 'hsl(var(--primary))',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(laneRect);

      const laneLabel = new Text(lane.name, {
        left: GRID_PADDING + 5,
        top: GRID_PADDING + lane.grid_position_y * CELL_SIZE + 5,
        fontSize: 14,
        fill: 'hsl(var(--primary))',
        selectable: false,
        evented: false,
      });
      fabricCanvas.add(laneLabel);
    });

    // Draw stations
    stations.forEach((station) => {
      const stationRect = new Rect({
        left: GRID_PADDING + station.grid_position_x * CELL_SIZE,
        top: GRID_PADDING + station.grid_position_y * CELL_SIZE,
        width: station.grid_width * CELL_SIZE,
        height: station.grid_height * CELL_SIZE,
        fill: 'hsl(var(--accent))',
        stroke: 'hsl(var(--accent-foreground))',
        strokeWidth: 2,
        cornerColor: 'hsl(var(--primary))',
        cornerSize: 8,
        transparentCorners: false,
      });

      stationRect.set('data', { stationId: station.id });

      const stationLabel = new Text(station.name, {
        left: GRID_PADDING + station.grid_position_x * CELL_SIZE + 5,
        top: GRID_PADDING + station.grid_position_y * CELL_SIZE + 5,
        fontSize: 12,
        fill: 'hsl(var(--accent-foreground))',
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(stationRect);
      fabricCanvas.add(stationLabel);

      // Handle station movement
      stationRect.on('modified', () => {
        const newX = Math.round((stationRect.left! - GRID_PADDING) / CELL_SIZE);
        const newY = Math.round((stationRect.top! - GRID_PADDING) / CELL_SIZE);
        
        // Snap to grid
        stationRect.set({
          left: GRID_PADDING + newX * CELL_SIZE,
          top: GRID_PADDING + newY * CELL_SIZE,
        });
        
        stationLabel.set({
          left: GRID_PADDING + newX * CELL_SIZE + 5,
          top: GRID_PADDING + newY * CELL_SIZE + 5,
        });

        fabricCanvas.renderAll();

        const stationId = (stationRect.get('data') as any)?.stationId;
        if (stationId) {
          onStationMove(stationId, newX, newY);
        }
      });
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, gridWidth, gridHeight, lanes, stations, onStationMove]);

  const handleZoomIn = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.min(zoom + 0.2, 3);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleZoomOut = () => {
    if (!fabricCanvas) return;
    const newZoom = Math.max(zoom - 0.2, 0.5);
    setZoom(newZoom);
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  };

  const handleResetZoom = () => {
    if (!fabricCanvas) return;
    setZoom(1);
    fabricCanvas.setZoom(1);
    fabricCanvas.renderAll();
  };

  return (
    <Card className="p-4">
      <div className="flex gap-2 mb-4">
        <Button onClick={handleZoomIn} variant="outline" size="sm">
          <ZoomIn className="w-4 h-4 mr-2" />
          Zoom In
        </Button>
        <Button onClick={handleZoomOut} variant="outline" size="sm">
          <ZoomOut className="w-4 h-4 mr-2" />
          Zoom Out
        </Button>
        <Button onClick={handleResetZoom} variant="outline" size="sm">
          <Maximize2 className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="overflow-auto border rounded-lg">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Drag stations to reposition them on the grid. Changes are saved automatically.
      </p>
    </Card>
  );
};
