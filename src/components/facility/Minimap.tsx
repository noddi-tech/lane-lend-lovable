import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { type LayoutBlock } from './BlockGridBuilder';

interface MinimapProps {
  workingArea: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  blocks: LayoutBlock[];
  viewportTransform: number[] | null;
  containerSize: { width: number; height: number };
  cellSize: number;
  zoom: number;
  onNavigate: (x: number, y: number) => void;
  onClose: () => void;
}

export function Minimap({
  workingArea,
  blocks,
  viewportTransform,
  containerSize,
  cellSize,
  zoom,
  onNavigate,
  onClose,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapWidth = 200;
  const minimapHeight = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, minimapWidth, minimapHeight);

    // Calculate scale to fit working area in minimap
    const scaleX = minimapWidth / (workingArea.width * cellSize);
    const scaleY = minimapHeight / (workingArea.height * cellSize);
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to add padding

    const offsetX = (minimapWidth - workingArea.width * cellSize * scale) / 2;
    const offsetY = (minimapHeight - workingArea.height * cellSize * scale) / 2;

    // Draw working area boundary
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      offsetX,
      offsetY,
      workingArea.width * cellSize * scale,
      workingArea.height * cellSize * scale
    );

    // Draw blocks
    blocks.forEach((block) => {
      const x = (block.grid_x - workingArea.minX) * cellSize * scale + offsetX;
      const y = (block.grid_y - workingArea.minY) * cellSize * scale + offsetY;
      const width = block.grid_width * cellSize * scale;
      const height = block.grid_height * cellSize * scale;

      // Color based on type
      let color = '#3b82f6'; // Default blue
      if (block.type === 'gate') color = '#10b981';
      else if (block.type === 'lane') color = '#8b5cf6';
      else if (block.type === 'station') color = '#f59e0b';
      else if (block.type === 'room') color = block.color || '#3b82f6';
      else if (block.type === 'zone') color = block.color || '#8b5cf6';
      else if (block.type === 'outside') color = block.color || '#6b7280';
      else if (block.type === 'storage') color = '#ec4899';

      ctx.fillStyle = color + '80'; // Add transparency
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, y, width, height);
    });

    // Draw viewport indicator
    if (viewportTransform) {
      const vpX = (-viewportTransform[4] / zoom) * scale + offsetX;
      const vpY = (-viewportTransform[5] / zoom) * scale + offsetY;
      const vpWidth = (containerSize.width / zoom) * scale;
      const vpHeight = (containerSize.height / zoom) * scale;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(vpX, vpY, vpWidth, vpHeight);

      ctx.fillStyle = '#ef444420';
      ctx.fillRect(vpX, vpY, vpWidth, vpHeight);
    }
  }, [workingArea, blocks, viewportTransform, containerSize, cellSize, zoom]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = minimapWidth / (workingArea.width * cellSize);
    const scaleY = minimapHeight / (workingArea.height * cellSize);
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const offsetX = (minimapWidth - workingArea.width * cellSize * scale) / 2;
    const offsetY = (minimapHeight - workingArea.height * cellSize * scale) / 2;

    // Convert click position to grid coordinates
    const gridX = ((clickX - offsetX) / scale / cellSize) + workingArea.minX;
    const gridY = ((clickY - offsetY) / scale / cellSize) + workingArea.minY;

    onNavigate(gridX, gridY);
  };

  return (
    <Card className="absolute bottom-12 right-4 w-52 bg-background/95 backdrop-blur-sm shadow-lg z-20 p-2 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">Minimap</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={minimapWidth}
          height={minimapHeight}
          onClick={handleMinimapClick}
          className="border rounded cursor-pointer hover:border-primary transition-colors"
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        Click to navigate
      </p>
    </Card>
  );
}
