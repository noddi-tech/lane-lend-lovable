import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, MapPin, LayoutGrid, Box, DoorOpen, Home } from 'lucide-react';
import { BlockGridBuilder, type EditMode, type LayoutBlock } from '@/components/facility/BlockGridBuilder';
import { BlockProperties } from '@/components/facility/BlockProperties';
import { LibraryPalette, type LibraryItem } from '@/components/facility/LibraryPalette';
import { CreateGateDialog } from '@/components/facility/dialogs/CreateGateDialog';
import { CreateLaneDialog } from '@/components/facility/dialogs/CreateLaneDialog';
import { CreateStationDialog } from '@/components/facility/dialogs/CreateStationDialog';
import { CreateRoomDialog } from '@/components/facility/dialogs/CreateRoomDialog';
import { useUpdateDrivingGate, useAssignGateToFacility } from '@/hooks/admin/useDrivingGates';
import { useUpdateLane, useAssignLaneToFacility } from '@/hooks/admin/useLanes';
import { useLanes } from '@/hooks/admin/useLanes';
import { useStations, useUpdateStation, useAssignStationToLane } from '@/hooks/admin/useStations';
import { useRooms, useUpdateRoom } from '@/hooks/admin/useRooms';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebouncedMutation';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import type { DrivingGateWithLanes } from '@/hooks/admin/useDrivingGates';

interface FacilityLayoutBuilderProps {
  facility: FacilityWithGates;
  drivingGates: DrivingGateWithLanes[];
}

export function FacilityLayoutBuilder({ facility, drivingGates }: FacilityLayoutBuilderProps) {
  const [editMode, setEditMode] = useState<EditMode>('gate');
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);

  const updateGate = useUpdateDrivingGate();
  const updateLane = useUpdateLane();
  const updateStation = useUpdateStation();
  const updateRoom = useUpdateRoom();
  const assignGate = useAssignGateToFacility();
  const assignLane = useAssignLaneToFacility();
  const assignStation = useAssignStationToLane();

  const { data: allLanes } = useLanes();
  const { data: allStations } = useStations();
  const { data: allRooms } = useRooms(facility.id);

  // Debug: Track editMode changes
  useEffect(() => {
    console.log('🎯 FacilityLayoutBuilder editMode changed to:', editMode);
  }, [editMode]);

  const facilityGateIds = drivingGates.map(g => g.id);
  const facilityLanes = allLanes?.filter(lane => {
    // Lanes now belong directly to facilities
    return lane.facility_id === facility.id;
  }) || [];
  const facilityLaneIds = facilityLanes.map(l => l.id);
  const facilityStations = allStations?.filter(station =>
    facilityLaneIds.includes(station.lane_id)
  ) || [];

  const facilityBlock: LayoutBlock = {
    id: facility.id,
    type: 'facility',
    name: facility.name,
    grid_x: 0,
    grid_y: 0,
    grid_width: facility.grid_width,
    grid_height: facility.grid_height,
  };

  const gateBlocks: LayoutBlock[] = drivingGates.map(gate => ({
    id: gate.id,
    type: 'gate',
    name: gate.name,
    grid_x: gate.grid_position_x || 0,
    grid_y: gate.grid_position_y || 0,
    grid_width: gate.grid_width,
    grid_height: gate.grid_height,
    parent_id: facility.id,
  }));

  // Lanes belong to facility (not gates!), spanning full facility width
  const laneBlocks: LayoutBlock[] = facilityLanes.map(lane => ({
    id: lane.id,
    type: 'lane',
    name: lane.name,
    grid_x: 0, // Lanes span full width, starting at x=0
    grid_y: lane.grid_position_y || 0,
    grid_width: facility.grid_width, // Full facility width
    grid_height: lane.grid_height || 2,
    parent_id: facility.id, // Lanes belong to facility
  }));

  const stationBlocks: LayoutBlock[] = facilityStations.map(station => ({
    id: station.id,
    type: 'station',
    name: station.name,
    grid_x: station.grid_position_x,
    grid_y: station.grid_position_y,
    grid_width: station.grid_width,
    grid_height: station.grid_height,
    parent_id: station.lane_id,
  }));

  const roomBlocks: LayoutBlock[] = (allRooms || []).map(room => ({
    id: room.id,
    type: 'room',
    name: room.name,
    grid_x: room.grid_position_x,
    grid_y: room.grid_position_y,
    grid_width: room.grid_width,
    grid_height: room.grid_height,
    parent_id: facility.id,
    color: room.color,
  }));

  const handleBlockMove = useDebouncedCallback(
    async (blockId: string, gridX: number, gridY: number) => {
      const block = [...gateBlocks, ...laneBlocks, ...stationBlocks, ...roomBlocks].find(b => b.id === blockId);
      if (!block) return;

      try {
        if (block.type === 'gate') {
          await updateGate.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
          } as any);
        } else if (block.type === 'lane') {
          await updateLane.mutateAsync({
            id: blockId,
            grid_position_y: gridY,
          } as any);
        } else if (block.type === 'station') {
          await updateStation.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
          } as any);
        } else if (block.type === 'room') {
          await updateRoom.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
          } as any);
        }
      } catch (error) {
        toast.error('Failed to move block');
      }
    },
    350
  );

  const handleBlockResize = useDebouncedCallback(
    async (blockId: string, gridWidth: number, gridHeight: number) => {
      const block = [...gateBlocks, ...laneBlocks, ...stationBlocks, ...roomBlocks].find(b => b.id === blockId);
      if (!block) return;

      try {
        if (block.type === 'gate') {
          await updateGate.mutateAsync({
            id: blockId,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'lane') {
          await updateLane.mutateAsync({
            id: blockId,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'station') {
          await updateStation.mutateAsync({
            id: blockId,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'room') {
          await updateRoom.mutateAsync({
            id: blockId,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        }
      } catch (error) {
        toast.error('Failed to resize block');
      }
    },
    350
  );

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const { item, type } = JSON.parse(data) as { item: LibraryItem; type: 'gate' | 'lane' | 'station' };
      
      // Get canvas coordinates - simplified calculation
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      // Convert to grid coordinates (using CELL_SIZE from BlockGridBuilder)
      const CELL_SIZE = 15;
      const gridX = Math.floor(canvasX / CELL_SIZE);
      const gridY = Math.floor(canvasY / CELL_SIZE);
      
      if (type === 'gate') {
        await assignGate.mutateAsync({
          gateId: item.id,
          facilityId: facility.id,
          gridX,
          gridY,
        });
        toast.success(`Gate "${item.name}" placed in facility`);
      } else if (type === 'lane') {
        // For lanes, determine position order based on y position
        const existingLanes = facilityLanes.filter(l => l.facility_id === facility.id);
        const positionOrder = existingLanes.length;
        
        await assignLane.mutateAsync({
          laneId: item.id,
          facilityId: facility.id,
          gridY,
          positionOrder,
        });
        toast.success(`Lane "${item.name}" placed in facility`);
      } else if (type === 'station') {
        // For stations, need to assign to a lane
        if (facilityLanes.length === 0) {
          toast.error('Please create a lane first before adding stations');
          return;
        }
        
        // Find the lane at the drop position
        const targetLane = facilityLanes.find(lane => {
          const laneTop = lane.grid_position_y;
          const laneBottom = laneTop + (lane.grid_height || 2);
          return gridY >= laneTop && gridY < laneBottom;
        });
        
        if (!targetLane) {
          toast.error('Please drop the station inside a lane');
          return;
        }
        
        await assignStation.mutateAsync({
          stationId: item.id,
          laneId: targetLane.id,
          gridX,
          gridY,
        });
        toast.success(`Station "${item.name}" placed in lane`);
      }
    } catch (error) {
      console.error('Failed to place item:', error);
      toast.error('Failed to place item from library');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Block-Based Layout Builder
            </CardTitle>
            <CardDescription>
              Drag and drop gates, lanes, and stations to design your facility layout
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Edit:</span>
            <Button
              variant={editMode === 'gate' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('gate')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Gates
            </Button>
            <Button
              variant={editMode === 'lane' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('lane')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Lanes
            </Button>
            <Button
              variant={editMode === 'station' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('station')}
            >
              <Box className="h-4 w-4 mr-2" />
              Stations
            </Button>
            <Button
              variant={editMode === 'room' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('room')}
            >
              <Home className="h-4 w-4 mr-2" />
              Rooms
            </Button>
          </div>

          <div className="flex gap-2">
            {editMode === 'gate' && (
              <Button onClick={() => setShowCreateGateDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Gate
              </Button>
            )}
            {editMode === 'lane' && (
              <Button onClick={() => setShowCreateLaneDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lane
              </Button>
            )}
            {editMode === 'station' && (
              <Button onClick={() => setShowCreateStationDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            )}
            {editMode === 'room' && (
              <Button onClick={() => setShowCreateRoomDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Library Palette */}
          <div className="flex-shrink-0">
            <LibraryPalette editMode={editMode} />
          </div>

          {/* Canvas */}
          <div className="flex-1">
            <BlockGridBuilder
              facility={facilityBlock}
              gates={gateBlocks}
              lanes={laneBlocks}
              stations={stationBlocks}
              rooms={roomBlocks}
              editMode={editMode}
              onBlockMove={handleBlockMove}
              onBlockResize={handleBlockResize}
              onBlockSelect={setSelectedBlock}
              onDrop={handleCanvasDrop}
            />
          </div>

          {/* Properties Panel */}
          <div className="flex-shrink-0 w-80">
            {selectedBlock ? (
              <BlockProperties
                block={selectedBlock}
                onClose={() => setSelectedBlock(null)}
              />
            ) : (
              <Card className="p-6">
                <p className="text-sm text-muted-foreground text-center">
                  Select a block to view and edit its properties
                </p>
              </Card>
            )}
          </div>
        </div>
      </CardContent>

      <CreateGateDialog
        open={showCreateGateDialog}
        onOpenChange={setShowCreateGateDialog}
        facilityId={facility.id}
      />

      <CreateLaneDialog
        open={showCreateLaneDialog}
        onOpenChange={setShowCreateLaneDialog}
        facilityId={facility.id}
      />

      <CreateStationDialog
        open={showCreateStationDialog}
        onOpenChange={setShowCreateStationDialog}
        lanes={facilityLanes.map(l => ({ id: l.id, name: l.name }))}
      />

      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
        facilityId={facility.id}
      />
    </Card>
  );
}
