import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layers, Plus, MapPin, LayoutGrid, Box } from 'lucide-react';
import { BlockGridBuilder, type EditMode, type LayoutBlock } from '@/components/facility/BlockGridBuilder';
import { BlockProperties } from '@/components/facility/BlockProperties';
import { CreateGateDialog } from '@/components/facility/dialogs/CreateGateDialog';
import { CreateLaneDialog } from '@/components/facility/dialogs/CreateLaneDialog';
import { CreateStationDialog } from '@/components/facility/dialogs/CreateStationDialog';
import { useUpdateDrivingGate } from '@/hooks/admin/useDrivingGates';
import { useUpdateLane } from '@/hooks/admin/useLanes';
import { useLanes } from '@/hooks/admin/useLanes';
import { useStations, useUpdateStation } from '@/hooks/admin/useStations';
import { toast } from 'sonner';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import type { DrivingGateWithLanes } from '@/hooks/admin/useDrivingGates';

interface FacilityLayoutBuilderProps {
  facility: FacilityWithGates;
  drivingGates: DrivingGateWithLanes[];
}

export function FacilityLayoutBuilder({ facility, drivingGates }: FacilityLayoutBuilderProps) {
  const [editMode, setEditMode] = useState<EditMode>('gates');
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);

  const updateGate = useUpdateDrivingGate();
  const updateLane = useUpdateLane();
  const updateStation = useUpdateStation();

  const { data: allLanes } = useLanes();
  const { data: allStations } = useStations();

  const facilityGateIds = drivingGates.map(g => g.id);
  const facilityLanes = allLanes?.filter(lane => {
    // Find the gate that belongs to this facility and check if lane belongs to facility
    const laneGate = drivingGates.find(g => g.id === lane.driving_gate?.id);
    return laneGate !== undefined;
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

  const handleBlockMove = async (blockId: string, gridX: number, gridY: number) => {
    const block = [...gateBlocks, ...laneBlocks, ...stationBlocks].find(b => b.id === blockId);
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
      }
    } catch (error) {
      toast.error('Failed to move block');
    }
  };

  const handleBlockResize = async (blockId: string, gridWidth: number, gridHeight: number) => {
    const block = [...gateBlocks, ...laneBlocks, ...stationBlocks].find(b => b.id === blockId);
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
      }
    } catch (error) {
      toast.error('Failed to resize block');
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
              variant={editMode === 'gates' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('gates')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Gates
            </Button>
            <Button
              variant={editMode === 'lanes' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('lanes')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Lanes
            </Button>
            <Button
              variant={editMode === 'stations' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setEditMode('stations')}
            >
              <Box className="h-4 w-4 mr-2" />
              Stations
            </Button>
          </div>

          <div className="flex gap-2">
            {editMode === 'gates' && (
              <Button onClick={() => setShowCreateGateDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Gate
              </Button>
            )}
            {editMode === 'lanes' && (
              <Button onClick={() => setShowCreateLaneDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lane
              </Button>
            )}
            {editMode === 'stations' && (
              <Button onClick={() => setShowCreateStationDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Station
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <BlockGridBuilder
              facility={facilityBlock}
              gates={gateBlocks}
              lanes={laneBlocks}
              stations={stationBlocks}
              editMode={editMode}
              onBlockMove={handleBlockMove}
              onBlockResize={handleBlockResize}
              onBlockSelect={setSelectedBlock}
            />
          </div>

          <div className="col-span-1">
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
    </Card>
  );
}
