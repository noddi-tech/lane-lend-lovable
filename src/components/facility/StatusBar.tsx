import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Map, Keyboard, Grid3x3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StatusBarProps {
  gridWidth: number;
  gridHeight: number;
  zoom: number;
  elementCount: number;
  selectedElementName?: string;
  minimapVisible: boolean;
  onToggleMinimap: () => void;
  onShowShortcuts: () => void;
}

export function StatusBar({
  gridWidth,
  gridHeight,
  zoom,
  elementCount,
  selectedElementName,
  minimapVisible,
  onToggleMinimap,
  onShowShortcuts,
}: StatusBarProps) {
  return (
    <div className="h-8 border-t bg-muted/50 px-4 flex items-center justify-between text-xs">
      {/* Left: Minimap toggle + Grid info */}
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMinimap}
                className={`h-6 text-xs ${minimapVisible ? 'bg-accent' : ''}`}
              >
                <Map className="h-3 w-3 mr-1" />
                Minimap
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Minimap</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-4" />

        <div className="flex items-center gap-1 text-muted-foreground">
          <Grid3x3 className="h-3 w-3" />
          <span>
            Grid: {gridWidth} × {gridHeight}
          </span>
        </div>
      </div>

      {/* Center: Element info */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs h-5">
          {elementCount} {elementCount === 1 ? 'element' : 'elements'}
        </Badge>
        {selectedElementName && (
          <Badge variant="secondary" className="text-xs h-5">
            {selectedElementName} selected
          </Badge>
        )}
      </div>

      {/* Right: Zoom + Shortcuts */}
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">
          Zoom: {Math.round(zoom * 100)}%
        </span>

        <Separator orientation="vertical" className="h-4" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowShortcuts}
                className="h-6 text-xs"
              >
                <Keyboard className="h-3 w-3 mr-1" />
                Shortcuts
              </Button>
            </TooltipTrigger>
            <TooltipContent>View keyboard shortcuts (?)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
