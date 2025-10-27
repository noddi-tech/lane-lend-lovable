import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
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

interface FacilityGridBuilderProps {
  gridWidth: number;
  gridHeight: number;
  gates: Gate[];
  onGateMove?: (gateId: string, x: number, y: number) => void;
  onGateClick?: (gateId: string) => void;
}

export function FacilityGridBuilder({
  gridWidth,
  gridHeight,
  gates,
  onGateMove,
  onGateClick,
}: FacilityGridBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [zoom, setZoom] = useState(1);

  const CELL_SIZE = 20;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Draw grid
    for (let i = 0; i <= gridWidth; i++) {
      const line = new fabric.Line(
        [i * CELL_SIZE, 0, i * CELL_SIZE, gridHeight * CELL_SIZE],
        { stroke: '#e5e7eb', strokeWidth: 1, selectable: false, evented: false }
      );
      canvas.add(line);
    }

    for (let j = 0; j <= gridHeight; j++) {
      const line = new fabric.Line(
        [0, j * CELL_SIZE, gridWidth * CELL_SIZE, j * CELL_SIZE],
        { stroke: '#e5e7eb', strokeWidth: 1, selectable: false, evented: false }
      );
      canvas.add(line);
    }

    // Draw gates
    gates.forEach((gate) => {
      const gateRect = new fabric.Rect({
        left: gate.grid_position_x * CELL_SIZE,
        top: gate.grid_position_y * CELL_SIZE,
        width: gate.grid_width * CELL_SIZE,
        height: gate.grid_height * CELL_SIZE,
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#3b82f6',
        strokeWidth: 2,
        rx: 4,
        ry: 4,
      });

      const gateText = new fabric.Text(gate.name, {
        left: gate.grid_position_x * CELL_SIZE + (gate.grid_width * CELL_SIZE) / 2,
        top: gate.grid_position_y * CELL_SIZE + (gate.grid_height * CELL_SIZE) / 2,
        fontSize: 14,
        fill: '#1f2937',
        originX: 'center',
        originY: 'center',
        fontFamily: 'Arial',
      });

      const gateGroup = new fabric.Group([gateRect, gateText], {
        selectable: true,
        hasControls: false,
        hasBorders: true,
        lockRotation: true,
        data: { gateId: gate.id },
      } as any);

      gateGroup.on('mousedown', () => {
        if (onGateClick) {
          onGateClick(gate.id);
        }
      });

      gateGroup.on('modified', () => {
        if (!onGateMove) return;

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

      canvas.add(gateGroup);
    });

    canvas.renderAll();
  }, [canvas, gridWidth, gridHeight, gates, onGateMove, onGateClick]);

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
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleResetZoom}>
          <Maximize2 className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground self-center ml-2">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>
      <div className="border rounded-lg overflow-auto bg-muted/30">
        <canvas ref={canvasRef} />
      </div>
      <p className="text-xs text-muted-foreground">
        Click and drag gates to reposition them on the facility floor plan
      </p>
    </div>
  );
}
