import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Map, Square, DoorOpen, Layers as LayersIcon, Settings, Archive, Plus, Info } from 'lucide-react';
import { EditMode } from '@/components/facility/BlockGridBuilder';

// Grouped mode type
export type GroupMode = 'spaces' | 'workflow' | 'storage';

// Mapping of groups to element types
export const GROUP_TO_ELEMENTS: Record<GroupMode, EditMode[]> = {
  spaces: ['room', 'outside', 'zone'],
  workflow: ['gate', 'lane', 'station'],
  storage: ['storage'],
};

// Reverse mapping: element to group
export const ELEMENT_TO_GROUP: Record<EditMode, GroupMode | null> = {
  view: null,
  facility: null,
  room: 'spaces',
  outside: 'spaces',
  zone: 'spaces',
  gate: 'workflow',
  lane: 'workflow',
  station: 'workflow',
  storage: 'storage',
};

interface EditModeSelectorProps {
  currentMode: EditMode;
  onModeChange: (mode: EditMode) => void;
  onShowCreateDialog: (type: EditMode) => void;
}

export function EditModeSelector({ currentMode, onModeChange, onShowCreateDialog }: EditModeSelectorProps) {
  // State for which tab is active - initialize based on current edit mode
  const [activeGroup, setActiveGroup] = useState<GroupMode>(() => {
    return ELEMENT_TO_GROUP[currentMode] || 'workflow';
  });

  return (
    <div className="space-y-3">
      {/* Group Tabs */}
      <Tabs value={activeGroup} onValueChange={(v) => setActiveGroup(v as GroupMode)}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="spaces" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Spaces</span>
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
        </TabsList>

        {/* Spaces Tab Content */}
        <TabsContent value="spaces" className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Select:</span>
            <Button
              variant={currentMode === 'room' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('room')}
            >
              <Home className="h-4 w-4 mr-2" />
              Rooms
            </Button>
            <Button
              variant={currentMode === 'outside' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('outside')}
            >
              <Map className="h-4 w-4 mr-2" />
              Outside Areas
            </Button>
            <Button
              variant={currentMode === 'zone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('zone')}
            >
              <Square className="h-4 w-4 mr-2" />
              Zones
            </Button>
            
            <div className="h-6 w-px bg-border ml-2" />
            
            {/* Contextual Add Button */}
            {currentMode === 'room' && (
              <Button size="sm" onClick={() => onShowCreateDialog('room')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
            {currentMode === 'outside' && (
              <Button size="sm" onClick={() => onShowCreateDialog('outside')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Outside Area
              </Button>
            )}
            {currentMode === 'zone' && (
              <Button size="sm" onClick={() => onShowCreateDialog('zone')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            )}
          </div>

          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              Define your facility structure first by creating rooms, outside areas, and zones.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Workflow Tab Content */}
        <TabsContent value="workflow" className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Select:</span>
            <Button
              variant={currentMode === 'gate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('gate')}
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Gates
            </Button>
            <Button
              variant={currentMode === 'lane' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('lane')}
            >
              <LayersIcon className="h-4 w-4 mr-2" />
              Lanes
            </Button>
            <Button
              variant={currentMode === 'station' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('station')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Stations
            </Button>
            
            <div className="h-6 w-px bg-border ml-2" />
            
            {/* Contextual Add Button */}
            {currentMode === 'gate' && (
              <Button size="sm" onClick={() => onShowCreateDialog('gate')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Gate
              </Button>
            )}
            {currentMode === 'lane' && (
              <Button size="sm" onClick={() => onShowCreateDialog('lane')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Lane
              </Button>
            )}
            {currentMode === 'station' && (
              <Button size="sm" onClick={() => onShowCreateDialog('station')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            )}
          </div>

          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              Place gates for entry points, lanes for workflow paths, then position stations.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Storage Tab Content */}
        <TabsContent value="storage" className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Select:</span>
            <Button
              variant={currentMode === 'storage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange('storage')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Storage Locations
            </Button>
            
            <div className="h-6 w-px bg-border ml-2" />
            
            {/* Contextual Add Button */}
            {currentMode === 'storage' && (
              <Button size="sm" onClick={() => onShowCreateDialog('storage')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Storage Location
              </Button>
            )}
          </div>

          <Alert className="bg-muted/50 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              Place storage locations within lanes or rooms for inventory management.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
