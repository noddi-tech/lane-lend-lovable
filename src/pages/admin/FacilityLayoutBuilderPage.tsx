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
import { BlockGridBuilder, type EditMode, type LayoutBlock, ELEMENT_TO_GROUP } from '@/components/facility/BlockGridBuilder';
import { BlockProperties } from '@/components/facility/BlockProperties';
import { LibraryPalette, type LibraryItem } from '@/components/facility/LibraryPalette';
import { EditModeSelector } from '@/components/facility/EditModeSelector';
import { LayoutToolbar } from '@/components/facility/LayoutToolbar';
import { CreateGateDialog } from '@/components/facility/dialogs/CreateGateDialog';
import { CreateLaneDialog } from '@/components/facility/dialogs/CreateLaneDialog';
import { CreateStationDialog } from '@/components/facility/dialogs/CreateStationDialog';
import { CreateRoomDialog } from '@/components/facility/dialogs/CreateRoomDialog';
import { CreateOutsideAreaDialog } from '@/components/facility/dialogs/CreateOutsideAreaDialog';
import { CreateStorageLocationDialog } from '@/components/facility/dialogs/CreateStorageLocationDialog';
import { CreateZoneDialog } from '@/components/facility/dialogs/CreateZoneDialog';
import { DefineBoundaryDialog } from '@/components/facility/dialogs/DefineBoundaryDialog';
import { toast } from 'sonner';
import { useDebouncedCallback } from '@/hooks/useDebouncedMutation';
import { useQueryClient } from '@tanstack/react-query';
import { calculateOptimalBoundary } from '@/utils/facilityBoundaryCalculator';

export default function FacilityLayoutBuilderPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState<EditMode>('room');
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateOutsideDialog, setShowCreateOutsideDialog] = useState(false);
  const [showCreateStorageDialog, setShowCreateStorageDialog] = useState(false);
  const [showCreateZoneDialog, setShowCreateZoneDialog] = useState(false);
  const [showBoundaryDialog, setShowBoundaryDialog] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<LayoutBlock | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(false); // Auto-hide by default
  const [isDraggingFromLibrary, setIsDraggingFromLibrary] = useState(false);
  const [propertiesPinned, setPropertiesPinned] = useState(false);
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
    gridWidth: facility?.grid_width || 1000,
    gridHeight: facility?.grid_height || 1000,
  });

  // Auto-show properties when block selected, auto-hide when deselected
  useEffect(() => {
    if (selectedBlock && !propertiesPinned) {
      setShowProperties(true);
    } else if (!selectedBlock && !propertiesPinned) {
      const timer = setTimeout(() => setShowProperties(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedBlock, propertiesPinned]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // L - Toggle Library
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowLibrary(prev => !prev);
        }
      }
      // P - Toggle Properties
      if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowProperties(prev => !prev);
          if (!showProperties) setPropertiesPinned(true);
        }
      }
      // Esc - Deselect and close panels
      if (e.key === 'Escape') {
        setSelectedBlock(null);
        setPropertiesPinned(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProperties]);

  useEffect(() => {
    console.log('🎯 FacilityLayoutBuilderPage editMode changed to:', editMode);
  }, [editMode]);
  
  useEffect(() => {
    if (facility && viewContext.type === 'facility') {
      setViewContext({
        type: 'facility',
        id: facility.id,
        name: facility.name,
        gridWidth: facility.grid_width || 1000,
        gridHeight: facility.grid_height || 1000,
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

  // Helper function to detect parent container at drop position
  const detectParentContainer = (gridX: number, gridY: number, itemType: string): { parentType: string; parentId: string | null; roomId?: string | null } => {
    // For stations and storage, check if they're inside a zone or lane
    if (itemType === 'station' || itemType === 'storage') {
      // First check zones
      for (const zone of zoneBlocks) {
        if (gridX >= zone.grid_x && gridX < zone.grid_x + zone.grid_width &&
            gridY >= zone.grid_y && gridY < zone.grid_y + zone.grid_height) {
          return { parentType: 'zone', parentId: zone.id };
        }
      }
      
      // Then check lanes
      for (const lane of laneBlocks) {
        if (gridX >= lane.grid_x && gridX < lane.grid_x + lane.grid_width &&
            gridY >= lane.grid_y && gridY < lane.grid_y + lane.grid_height) {
          return { parentType: 'lane', parentId: lane.id };
        }
      }
    }
    
    // For lanes and zones, check if they're inside a room or outside area
    if (itemType === 'lane' || itemType === 'zone') {
      // Check rooms
      for (const room of roomBlocks) {
        if (gridX >= room.grid_x && gridX < room.grid_x + room.grid_width &&
            gridY >= room.grid_y && gridY < room.grid_y + room.grid_height) {
          return { parentType: 'room', parentId: room.id, roomId: room.id };
        }
      }
      
      // Check outside areas
      for (const outside of outsideBlocks) {
        if (gridX >= outside.grid_x && gridX < outside.grid_x + outside.grid_width &&
            gridY >= outside.grid_y && gridY < outside.grid_y + outside.grid_height) {
          return { parentType: 'outside', parentId: outside.id, roomId: outside.id };
        }
      }
    }
    
    // Default to facility
    return { parentType: 'facility', parentId: facility.id };
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const { item, type } = JSON.parse(data) as { item: LibraryItem; type: 'gate' | 'lane' | 'station' | 'storage' | 'zone' };
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;
      
      const CELL_SIZE = 30;
      const gridX = Math.floor(canvasX / CELL_SIZE);
      const gridY = Math.floor(canvasY / CELL_SIZE);
      
      // Detect parent container
      const parent = detectParentContainer(gridX, gridY, type);
      
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
        
        if (parent.roomId) {
          await updateLane.mutateAsync({
            id: item.id,
            room_id: parent.roomId,
          } as any);
        }
        
        toast.success(`Lane "${item.name}" placed in ${parent.parentType}`);
      } else if (type === 'zone') {
        const updates: any = {
          facility_id: facility.id,
          grid_position_x: gridX,
          grid_position_y: gridY,
        };
        
        if (parent.roomId) {
          updates.room_id = parent.roomId;
        }
        
        await updateZone.mutateAsync({
          id: item.id,
          ...updates,
        });
        
        toast.success(`Zone "${item.name}" placed in ${parent.parentType}`);
      } else if (type === 'station') {
        const updates: any = {
          grid_position_x: gridX,
          grid_position_y: gridY,
        };
        
        if (parent.parentType === 'lane') {
          updates.lane_id = parent.parentId;
        } else if (parent.parentType === 'zone') {
          updates.zone_id = parent.parentId;
        } else {
          toast.error('Please drop the station inside a lane or zone');
          return;
        }
        
        await updateStation.mutateAsync({
          id: item.id,
          ...updates,
        } as any);
        
        toast.success(`Station "${item.name}" placed in ${parent.parentType}`);
      } else if (type === 'storage') {
        const updates: any = {
          grid_position_x: gridX,
          grid_position_y: gridY,
        };
        
        if (parent.parentType === 'lane') {
          updates.lane_id = parent.parentId;
        } else if (parent.parentType === 'zone') {
          updates.zone_id = parent.parentId;
        } else {
          toast.error('Please drop storage inside a lane or zone');
          return;
        }
        
        await updateStorageLocation.mutateAsync({
          id: item.id,
          ...updates,
        } as any);
        
        toast.success(`Storage "${item.name}" placed in ${parent.parentType}`);
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

  const handleShowCreateDialog = (type: EditMode) => {
    switch (type) {
      case 'gate':
        setShowCreateGateDialog(true);
        break;
      case 'lane':
        setShowCreateLaneDialog(true);
        break;
      case 'station':
        setShowCreateStationDialog(true);
        break;
      case 'room':
        setShowCreateRoomDialog(true);
        break;
      case 'outside':
        setShowCreateOutsideDialog(true);
        break;
      case 'storage':
        setShowCreateStorageDialog(true);
        break;
      case 'zone':
        setShowCreateZoneDialog(true);
        break;
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
                Layout Builder - Infinite Canvas
                {facility.is_bounded && ` (Boundary: ${facility.grid_width}×${facility.grid_height})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBoundaryDialog(true)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Define Boundary
            </Button>
            <Badge variant="outline" className="flex items-center gap-2">
              {ELEMENT_TO_GROUP[editMode] && (
                <>
                  <span className="text-muted-foreground">
                    {ELEMENT_TO_GROUP[editMode]!.charAt(0).toUpperCase() + ELEMENT_TO_GROUP[editMode]!.slice(1)}
                  </span>
                  <span>→</span>
                </>
              )}
              <span>{editMode.charAt(0).toUpperCase() + editMode.slice(1)}</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <LayoutToolbar
        editMode={editMode}
        facilityName={facility.name}
        viewContext={{
          type: viewContext.type,
          name: viewContext.name,
        }}
        showLibrary={showLibrary}
        showProperties={showProperties}
        onEditModeChange={setEditMode}
        onShowCreateDialog={handleShowCreateDialog}
        onToggleLibrary={() => setShowLibrary(prev => !prev)}
        onToggleProperties={() => {
          setShowProperties(prev => !prev);
          if (!showProperties) setPropertiesPinned(true);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Library Panel */}
        <div
          className={`flex-shrink-0 border-r bg-card overflow-y-auto transition-all duration-300 ease-in-out ${
            showLibrary ? 'w-60 opacity-100' : 'w-0 opacity-0'
          } ${isDraggingFromLibrary ? 'opacity-40' : ''}`}
        >
          {showLibrary && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Library</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLibrary(false)}
                  title="Close Library (L)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <LibraryPalette
                editMode={editMode}
                onItemDragStart={() => setIsDraggingFromLibrary(true)}
                onItemDragEnd={() => setIsDraggingFromLibrary(false)}
              />
            </div>
          )}
        </div>

        {/* Toggle Library Button */}
        {!showLibrary && (
          <Button
            variant="outline"
            size="sm"
            className="absolute left-4 top-32 z-10 shadow-lg"
            onClick={() => setShowLibrary(true)}
            title="Open Library (L)"
          >
            <ChevronRight className="h-4 w-4 mr-1" />
            Library
          </Button>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-muted/20 relative">
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
        <div
          className={`flex-shrink-0 border-l bg-card overflow-y-auto transition-all duration-300 ease-in-out ${
            showProperties ? 'w-60 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {showProperties && (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Properties</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPropertiesPinned(!propertiesPinned);
                      toast.success(propertiesPinned ? 'Properties unpinned' : 'Properties pinned');
                    }}
                    title={propertiesPinned ? 'Unpin (Auto-hide)' : 'Pin (Always visible)'}
                  >
                    <MapPin className={`h-4 w-4 ${propertiesPinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowProperties(false);
                      setPropertiesPinned(false);
                    }}
                    title="Close Properties (P)"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {selectedBlock ? (
                <BlockProperties
                  block={selectedBlock}
                  onClose={() => {
                    setSelectedBlock(null);
                    setPropertiesPinned(false);
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <LayoutGrid className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a block to view properties
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press P to close • Esc to deselect
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toggle Properties Button */}
        {!showProperties && selectedBlock && (
          <Button
            variant="outline"
            size="sm"
            className="absolute right-4 top-32 z-10 shadow-lg"
            onClick={() => {
              setShowProperties(true);
              setPropertiesPinned(true);
            }}
            title="Open Properties (P)"
          >
            Properties
            <ChevronLeft className="h-4 w-4 ml-1" />
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

      <DefineBoundaryDialog
        open={showBoundaryDialog}
        onOpenChange={setShowBoundaryDialog}
        facilityId={facility.id}
        blocks={[...gateBlocks, ...laneBlocks, ...stationBlocks, ...roomBlocks, ...outsideBlocks, ...storageBlocks, ...zoneBlocks]}
      />
    </div>
  );
}
