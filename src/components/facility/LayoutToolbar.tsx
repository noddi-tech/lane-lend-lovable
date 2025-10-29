import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  PanelLeft,
  PanelRight,
  Plus,
  Home,
  ChevronRight,
  DoorOpen,
  Layers,
  Box,
  Map,
  Archive,
  Square,
  LayoutGrid,
} from 'lucide-react';
import { EditModeSelector } from './EditModeSelector';
import { type EditMode } from './BlockGridBuilder';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LayoutToolbarProps {
  editMode: EditMode;
  facilityName: string;
  viewContext: {
    type: 'facility' | 'room';
    name: string;
  };
  showLibrary: boolean;
  showProperties: boolean;
  onEditModeChange: (mode: EditMode) => void;
  onShowCreateDialog: (dialogType: string) => void;
  onToggleLibrary: () => void;
  onToggleProperties: () => void;
  onQuickAdd?: () => void;
}

export function LayoutToolbar({
  editMode,
  facilityName,
  viewContext,
  showLibrary,
  showProperties,
  onEditModeChange,
  onShowCreateDialog,
  onToggleLibrary,
  onToggleProperties,
  onQuickAdd,
}: LayoutToolbarProps) {
  const getQuickAddConfig = () => {
    switch (editMode) {
      case 'gate':
        return { icon: DoorOpen, label: 'Add Gate', key: 'G', dialog: 'gate' };
      case 'lane':
        return { icon: Layers, label: 'Add Lane', key: 'L', dialog: 'lane' };
      case 'station':
        return { icon: Box, label: 'Add Station', key: 'S', dialog: 'station' };
      case 'room':
        return { icon: Home, label: 'Add Room', key: 'R', dialog: 'room' };
      case 'zone':
        return { icon: Square, label: 'Add Zone', key: 'Z', dialog: 'zone' };
      case 'outside':
        return { icon: Map, label: 'Add Outside Area', key: 'O', dialog: 'outside' };
      case 'storage':
        return { icon: Archive, label: 'Add Storage', key: 'A', dialog: 'storage' };
      default:
        return null;
    }
  };

  const quickAddConfig = getQuickAddConfig();

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
      {/* Left: Panel toggles + Mode selector */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleLibrary}
                className={showLibrary ? 'bg-accent' : ''}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Library (L)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-6" />

        <EditModeSelector
          currentMode={editMode}
          onModeChange={onEditModeChange}
          onShowCreateDialog={onShowCreateDialog}
        />

        {quickAddConfig && (
          <>
            <Separator orientation="vertical" className="h-6" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowCreateDialog(quickAddConfig.dialog)}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    <quickAddConfig.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{quickAddConfig.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Quick add {quickAddConfig.label.toLowerCase()} ({quickAddConfig.key})
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>

      {/* Center: Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <Home className="h-3 w-3 text-muted-foreground" />
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-foreground">{facilityName}</span>
        {viewContext.type === 'room' && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {viewContext.name}
            </Badge>
          </>
        )}
      </div>

      {/* Right: Properties toggle */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleProperties}
                className={showProperties ? 'bg-accent' : ''}
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Properties (P)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
