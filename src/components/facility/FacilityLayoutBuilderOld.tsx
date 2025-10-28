import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { UnifiedGridBuilder } from "./UnifiedGridBuilder";
import { useUpdateDrivingGate } from "@/hooks/admin/useDrivingGates";
import { useLanes, useUpdateLane } from "@/hooks/admin/useLanes";
import { useStations, useUpdateStation } from "@/hooks/admin/useStations";
import { useUpdateFacility } from "@/hooks/admin/useFacilities";
import { CreateGateDialog } from "./dialogs/CreateGateDialog";
import { CreateLaneDialog } from "./dialogs/CreateLaneDialog";
import { CreateStationDialog } from "./dialogs/CreateStationDialog";
import { SelectedElementPanel } from "./SelectedElementPanel";
import { toast } from "sonner";
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import type { DrivingGateWithLanes } from '@/hooks/admin/useDrivingGates';

type EditMode = 'facility' | 'gates' | 'lanes' | 'stations';

interface FacilityLayoutBuilderProps {
  facility: FacilityWithGates;
  drivingGates: DrivingGateWithLanes[];
}

export function FacilityLayoutBuilder({ facility, drivingGates }: FacilityLayoutBuilderProps) {
  const [editMode, setEditMode] = useState<EditMode>('facility');
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{ type: string; id: string; data: any } | null>(null);
  
  const updateGate = useUpdateDrivingGate();
  const updateFacility = useUpdateFacility();
  const updateLane = useUpdateLane();
  const updateStation = useUpdateStation();

  // Fetch lanes for all driving gates in this facility
  const { data: allLanes = [] } = useLanes();
  const lanes = allLanes.filter(lane => 
    drivingGates.some(gate => gate.id === lane.driving_gate?.id)
  );

  // Fetch stations for all lanes
  const { data: allStations = [] } = useStations();
  const stations = allStations.filter(station =>
    lanes.some(lane => lane.id === station.lane?.id)
  );

  const handleGateMove = async (gateId: string, gridX: number, gridY: number) => {
    try {
      await updateGate.mutateAsync({
        id: gateId,
        grid_x: gridX,
        grid_y: gridY,
      } as any);
    } catch (error) {
      toast.error("Failed to move gate");
    }
  };

  const handleLaneMove = async (laneId: string, gridX: number, gridY: number) => {
    try {
      await updateLane.mutateAsync({
        id: laneId,
        grid_y: gridY,
      } as any);
    } catch (error) {
      toast.error("Failed to move lane");
    }
  };

  const handleStationMove = async (stationId: string, gridX: number, gridY: number) => {
    try {
      await updateStation.mutateAsync({
        id: stationId,
        grid_x: gridX,
        grid_y: gridY,
      } as any);
    } catch (error) {
      toast.error("Failed to move station");
    }
  };

  const handleFacilityResize = async (gridWidth: number, gridHeight: number) => {
    try {
      await updateFacility.mutateAsync({
        id: facility.id,
        grid_width: gridWidth,
        grid_height: gridHeight,
      });
      toast.success("Facility grid resized");
    } catch (error) {
      toast.error("Failed to resize facility");
    }
  };

  const handleGateResize = async (gateId: string, gridWidth: number, gridHeight: number) => {
    try {
      await updateGate.mutateAsync({
        id: gateId,
        grid_width: gridWidth,
        grid_height: gridHeight,
      } as any);
    } catch (error) {
      toast.error("Failed to resize gate");
    }
  };

  const handleLaneResize = async (laneId: string, gridHeight: number) => {
    try {
      await updateLane.mutateAsync({
        id: laneId,
        grid_height: gridHeight,
      } as any);
    } catch (error) {
      toast.error("Failed to resize lane");
    }
  };

  const handleStationResize = async (stationId: string, gridWidth: number, gridHeight: number) => {
    try {
      await updateStation.mutateAsync({
        id: stationId,
        grid_width: gridWidth,
        grid_height: gridHeight,
      } as any);
    } catch (error) {
      toast.error("Failed to resize station");
    }
  };

  if (!facility) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facility Layout Editor</CardTitle>
        <CardDescription>
          Design and edit the physical layout of {facility.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2">
            <Button
              variant={editMode === 'facility' ? 'default' : 'outline'}
              onClick={() => setEditMode('facility')}
            >
              Facility Grid
            </Button>
            <Button
              variant={editMode === 'gates' ? 'default' : 'outline'}
              onClick={() => setEditMode('gates')}
            >
              Driving Gates <Badge variant="secondary" className="ml-2">{drivingGates.length}</Badge>
            </Button>
            <Button
              variant={editMode === 'lanes' ? 'default' : 'outline'}
              onClick={() => setEditMode('lanes')}
            >
              Lanes <Badge variant="secondary" className="ml-2">{lanes?.length || 0}</Badge>
            </Button>
            <Button
              variant={editMode === 'stations' ? 'default' : 'outline'}
              onClick={() => setEditMode('stations')}
            >
              Stations <Badge variant="secondary" className="ml-2">{stations?.length || 0}</Badge>
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

        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(220, 38, 38, 0.3)', border: '2px solid rgb(220, 38, 38)' }}></div>
            <span>Facility</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.6)', border: '2px solid rgb(5, 150, 105)' }}></div>
            <span>Driving Gates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(147, 51, 234, 0.4)', border: '2px solid rgb(126, 34, 206)' }}></div>
            <span>Lanes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.7)', border: '2px solid rgb(194, 65, 12)' }}></div>
            <span>Stations</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <UnifiedGridBuilder
              gridWidth={facility.grid_width || 100}
              gridHeight={facility.grid_height || 50}
              gates={drivingGates}
              lanes={lanes || []}
              stations={stations || []}
              editMode={editMode}
              onGateMove={handleGateMove}
              onLaneMove={handleLaneMove}
              onStationMove={handleStationMove}
              onFacilityResize={handleFacilityResize}
              onGateResize={handleGateResize}
              onLaneResize={handleLaneResize}
              onStationResize={handleStationResize}
              onElementSelect={setSelectedElement}
            />
          </div>
          
          {selectedElement && (
            <SelectedElementPanel
              element={selectedElement}
              onClose={() => setSelectedElement(null)}
            />
          )}
        </div>

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
          lanes={(lanes || []).map(l => ({ id: l.id, name: l.name || `Lane ${l.position_order}` }))}
        />
      </CardContent>
    </Card>
  );
}
