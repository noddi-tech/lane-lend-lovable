import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { useDrivingGates, useUpdateDrivingGate, useAssignGateToFacility, useUnassignGateFromFacility, useDeleteDrivingGate } from '@/hooks/admin/useDrivingGates';
import { useLanes, useUpdateLane, useAssignLaneToFacility, useUnassignLaneFromFacility, useDeleteLane } from '@/hooks/admin/useLanes';
import { useStations, useUpdateStation, useAssignStationToLane, useUnassignStationFromLane, useDeleteStation } from '@/hooks/admin/useStations';
import { useRooms, useUpdateRoom, useDeleteRoom } from '@/hooks/admin/useRooms';
import { useOutsideAreas, useUpdateOutsideArea, useDeleteOutsideArea } from '@/hooks/admin/useOutsideAreas';
import { useStorageLocations, useUpdateStorageLocation, useDeleteStorageLocation } from '@/hooks/admin/useStorageLocations';
import { useZones, useUpdateZone, useDeleteZone } from '@/hooks/admin/useZones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Layers, Box, Home, Plus, ChevronLeft, ChevronRight, LayoutGrid, Map, Archive, Square } from 'lucide-react';
import { BlockGridBuilder, type EditMode, type LayoutBlock } from '@/components/facility/BlockGridBuilder';
import { BlockProperties } from '@/components/facility/BlockProperties';
import { LibraryPalette, type LibraryItem } from '@/components/facility/LibraryPalette';
import { CreateGateDialog } from '@/components/facility/dialogs/CreateGateDialog';
import { CreateLaneDialog } from '@/components/facility/dialogs/CreateLaneDialog';
import { CreateStationDialog } from '@/components/facility/dialogs/CreateStationDialog';
import { CreateRoomDialog } from '@/components/facility/dialogs/CreateRoomDialog';
import { CreateOutsideAreaDialog } from '@/components/facility/dialogs/CreateOutsideAreaDialog';
import { CreateStorageLocationDialog } from '@/components/facility/dialogs/CreateStorageLocationDialog';
import { CreateZoneDialog } from '@/components/facility/dialogs/CreateZoneDialog';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebouncedMutation';
import { useQueryClient } from '@tanstack/react-query';

export default function FacilityLayoutBuilderPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState<EditMode>('gate');
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateOutsideDialog, setShowCreateOutsideDialog] = useState(false);
  const [showCreateStorageDialog, setShowCreateStorageDialog] = useState(false);
  const [showCreateZoneDialog, setShowCreateZoneDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const { data: facilities, isLoading: loadingFacilities } = useFacilities();
  const { data: allDrivingGates } = useDrivingGates();
  const { data: allLanes } = useLanes();
  const { data: allStations } = useStations();
  const { data: allOutsideAreas } = useOutsideAreas(facilityId);
  const { data: allStorageLocations } = useStorageLocations();
  const { data: allZones } = useZones(facilityId);

  const updateGate = useUpdateDrivingGate();
  const updateLane = useUpdateLane();
  const updateStation = useUpdateStation();
  const updateRoom = useUpdateRoom();
  const updateOutsideArea = useUpdateOutsideArea();
  const updateStorageLocation = useUpdateStorageLocation();
  const updateZone = useUpdateZone();
  const deleteGate = useDeleteDrivingGate();
  const deleteLane = useDeleteLane();
  const deleteStation = useDeleteStation();
  const deleteRoom = useDeleteRoom();
  const deleteOutsideArea = useDeleteOutsideArea();
  const deleteStorageLocation = useDeleteStorageLocation();
  const deleteZone = useDeleteZone();
  const assignGate = useAssignGateToFacility();
  const assignLane = useAssignLaneToFacility();
  const assignStation = useAssignStationToLane();
  const unassignGate = useUnassignGateFromFacility();
  const unassignLane = useUnassignLaneFromFacility();
  const unassignStation = useUnassignStationFromLane();

  const facility = facilities?.find(f => f.id === facilityId);
  const { data: allRooms } = useRooms(facilityId);
  
  const [viewContext, setViewContext] = useState<{ type: 'facility' | 'room'; id: string; name: string; gridWidth: number; gridHeight: number }>({
    type: 'facility',
    id: facility?.id || '',
    name: facility?.name || '',
    gridWidth: facility?.grid_width || 100,
    gridHeight: facility?.grid_height || 100,
  });

  useEffect(() => {
    console.log('🎯 FacilityLayoutBuilderPage editMode changed to:', editMode);
  }, [editMode]);
  
  useEffect(() => {
    if (facility && viewContext.type === 'facility') {
      setViewContext({
        type: 'facility',
        id: facility.id,
        name: facility.name,
        gridWidth: facility.grid_width,
        gridHeight: facility.grid_height,
      });
    }
  }, [facility]);

  if (loadingFacilities) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading facility...</div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Facility not found</p>
          <Button onClick={() => navigate('/admin/facility-management')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Facility Management
          </Button>
        </div>
      </div>
    );
  }

  const drivingGates = allDrivingGates?.filter(g => g.facility_id === facility.id) || [];
  const facilityGateIds = drivingGates.map(g => g.id);
  const facilityLanes = allLanes?.filter(lane => lane.facility_id === facility.id) || [];
  const facilityLaneIds = facilityLanes.map(l => l.id);
  const facilityStations = allStations?.filter(station => facilityLaneIds.includes(station.lane_id)) || [];

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

  const laneBlocks: LayoutBlock[] = facilityLanes.map(lane => ({
    id: lane.id,
    type: 'lane',
    name: lane.name,
    grid_x: lane.grid_position_x || 0,
    grid_y: lane.grid_position_y || 0,
    grid_width: lane.grid_width,
    grid_height: lane.grid_height || 2,
    parent_id: facility.id,
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

  const outsideBlocks: LayoutBlock[] = (allOutsideAreas || []).map(area => ({
    id: area.id,
    type: 'outside',
    name: area.name,
    grid_x: area.grid_position_x,
    grid_y: area.grid_position_y,
    grid_width: area.grid_width,
    grid_height: area.grid_height,
    parent_id: facility.id,
    color: area.color,
    area_type: area.area_type,
  }));

  const storageBlocks: LayoutBlock[] = (allStorageLocations || [])
    .filter(loc => loc.lane_id && facilityLaneIds.includes(loc.lane_id))
    .map(storage => ({
      id: storage.id,
      type: 'storage',
      name: storage.name,
      grid_x: storage.grid_position_x,
      grid_y: storage.grid_position_y,
      grid_width: storage.grid_width,
      grid_height: storage.grid_height,
      parent_id: storage.lane_id || storage.room_id,
      storage_type: storage.storage_type,
      status: storage.status,
    }));

  const zoneBlocks: LayoutBlock[] = (allZones || []).map(zone => ({
    id: zone.id,
    type: 'zone',
    name: zone.name,
    grid_x: zone.grid_position_x,
    grid_y: zone.grid_position_y,
    grid_width: zone.grid_width,
    grid_height: zone.grid_height,
    parent_id: facility.id,
    color: zone.color,
    zone_type: zone.zone_type,
  }));

  const handleBlockMove = async (blockId: string, gridX: number, gridY: number) => {
    const block = [...gateBlocks, ...laneBlocks, ...stationBlocks, ...roomBlocks, ...outsideBlocks, ...storageBlocks, ...zoneBlocks].find(b => b.id === blockId);
    if (!block) return;

    // Optimistic update for immediate visual feedback
    if (block.type === 'lane') {
      queryClient.setQueryData(['lanes', facilityId], (old: any) => {
        if (!old) return old;
        return old.map((lane: any) =>
          lane.id === blockId
            ? { ...lane, grid_position_x: gridX, grid_position_y: gridY }
            : lane
        );
      });
    }

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
          grid_position_x: gridX,
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
      } else if (block.type === 'outside') {
        await updateOutsideArea.mutateAsync({
          id: blockId,
          grid_position_x: gridX,
          grid_position_y: gridY,
        } as any);
      } else if (block.type === 'storage') {
        await updateStorageLocation.mutateAsync({
          id: blockId,
          grid_position_x: gridX,
          grid_position_y: gridY,
        } as any);
      } else if (block.type === 'zone') {
        await updateZone.mutateAsync({
          id: blockId,
          grid_position_x: gridX,
          grid_position_y: gridY,
        } as any);
      }
    } catch (error) {
      console.error('Failed to move block:', error);
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['lanes', facilityId] });
      toast.error('Failed to move block');
    }
  };

  const handleBlockResize = useDebouncedCallback(
    async (blockId: string, gridX: number, gridY: number, gridWidth: number, gridHeight: number) => {
      const block = [...gateBlocks, ...laneBlocks, ...stationBlocks, ...roomBlocks, ...outsideBlocks, ...storageBlocks, ...zoneBlocks].find(b => b.id === blockId);
      if (!block) return;

      try {
        if (block.type === 'gate') {
          await updateGate.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'lane') {
          await updateLane.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'station') {
          await updateStation.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'room') {
          await updateRoom.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'outside') {
          await updateOutsideArea.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'storage') {
          await updateStorageLocation.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        } else if (block.type === 'zone') {
          await updateZone.mutateAsync({
            id: blockId,
            grid_position_x: gridX,
            grid_position_y: gridY,
            grid_width: gridWidth,
            grid_height: gridHeight,
          } as any);
        }
      } catch (error) {
        console.error('Failed to resize block:', error);
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
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      const CELL_SIZE = 30;
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
        if (facilityLanes.length === 0) {
          toast.error('Please create a lane first before adding stations');
          return;
        }
        
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

  const handleDeleteBlock = async (block: LayoutBlock) => {
    if (!confirm(`Are you sure you want to delete "${block.name}"?`)) return;

    try {
      if (block.type === 'gate') {
        await deleteGate.mutateAsync(block.id);
      } else if (block.type === 'lane') {
        await deleteLane.mutateAsync(block.id);
      } else if (block.type === 'station') {
        await deleteStation.mutateAsync(block.id);
      } else if (block.type === 'room') {
        await deleteRoom.mutateAsync(block.id);
      } else if (block.type === 'outside') {
        await deleteOutsideArea.mutateAsync(block.id);
      } else if (block.type === 'storage') {
        await deleteStorageLocation.mutateAsync(block.id);
      } else if (block.type === 'zone') {
        await deleteZone.mutateAsync(block.id);
      }
      setSelectedBlock(null);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleReturnToLibrary = async (block: LayoutBlock) => {
    if (!confirm(`Return "${block.name}" to library? It will be unassigned from this facility.`)) return;

    try {
      if (block.type === 'gate') {
        await unassignGate.mutateAsync(block.id);
      } else if (block.type === 'lane') {
        await unassignLane.mutateAsync(block.id);
      } else if (block.type === 'station') {
        await unassignStation.mutateAsync(block.id);
      }
      setSelectedBlock(null);
      toast.success(`"${block.name}" returned to library`);
    } catch (error) {
      console.error('Failed to return to library:', error);
      toast.error('Failed to return item to library');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/facility-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Facility Management
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold">{facility.name}</h1>
              <p className="text-sm text-muted-foreground">
                Layout Builder - {facility.grid_width}×{facility.grid_height} grid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {editMode.charAt(0).toUpperCase() + editMode.slice(1)} Mode
            </Badge>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b bg-muted/30 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Edit Mode:</span>
            <Button
              variant={editMode === 'gate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('gate')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Gates
            </Button>
            <Button
              variant={editMode === 'lane' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('lane')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Lanes
            </Button>
            <Button
              variant={editMode === 'station' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('station')}
            >
              <Box className="h-4 w-4 mr-2" />
              Stations
            </Button>
            <Button
              variant={editMode === 'room' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('room')}
            >
              <Home className="h-4 w-4 mr-2" />
              Rooms
            </Button>
            <Button
              variant={editMode === 'outside' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('outside')}
            >
              <Map className="h-4 w-4 mr-2" />
              Outside
            </Button>
            <Button
              variant={editMode === 'storage' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('storage')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Storage
            </Button>
            <Button
              variant={editMode === 'zone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('zone')}
            >
              <Square className="h-4 w-4 mr-2" />
              Zones
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
            {editMode === 'outside' && (
              <Button onClick={() => setShowCreateOutsideDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Outside Area
              </Button>
            )}
            {editMode === 'storage' && (
              <Button onClick={() => setShowCreateStorageDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Storage
              </Button>
            )}
            {editMode === 'zone' && (
              <Button onClick={() => setShowCreateZoneDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Library Panel */}
        {showLibrary && (
          <div className="flex-shrink-0 w-80 border-r bg-card overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Library</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLibrary(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <LibraryPalette editMode={editMode} />
            </div>
          </div>
        )}

        {/* Toggle Library Button */}
        {!showLibrary && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-32 z-10"
            onClick={() => setShowLibrary(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-muted/20">
          <BlockGridBuilder
            facility={facilityBlock}
            gates={gateBlocks}
            lanes={laneBlocks}
            stations={stationBlocks}
            rooms={roomBlocks}
            outsideAreas={outsideBlocks}
            storageLocations={storageBlocks}
            zones={zoneBlocks}
            editMode={editMode}
            viewContext={viewContext}
            onBlockMove={handleBlockMove}
            onBlockResize={handleBlockResize}
            onBlockSelect={setSelectedBlock}
            onDrop={handleCanvasDrop}
            onDelete={handleDeleteBlock}
            onReturnToLibrary={handleReturnToLibrary}
            onEnterRoom={(roomId) => {
              const room = allRooms?.find(r => r.id === roomId);
              if (room) {
                setViewContext({
                  type: 'room',
                  id: room.id,
                  name: room.name,
                  gridWidth: room.grid_width,
                  gridHeight: room.grid_height,
                });
              }
            }}
          />
        </div>

        {/* Properties Panel */}
        {showProperties && (
          <div className="flex-shrink-0 w-80 border-l bg-card overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Properties</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProperties(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {selectedBlock ? (
                <BlockProperties
                  block={selectedBlock}
                  onClose={() => setSelectedBlock(null)}
                />
              ) : (
                <div className="text-center py-8">
                  <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a block to view properties
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Right-click for quick actions
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle Properties Button */}
        {!showProperties && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-32 z-10"
            onClick={() => setShowProperties(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dialogs */}
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

      <CreateOutsideAreaDialog
        open={showCreateOutsideDialog}
        onOpenChange={setShowCreateOutsideDialog}
        facilityId={facility.id}
      />

      <CreateStorageLocationDialog
        open={showCreateStorageDialog}
        onOpenChange={setShowCreateStorageDialog}
      />

      <CreateZoneDialog
        open={showCreateZoneDialog}
        onOpenChange={setShowCreateZoneDialog}
        facilityId={facility.id}
      />
    </div>
  );
}
