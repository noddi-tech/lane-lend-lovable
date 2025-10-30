import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { useDrivingGates, useUpdateDrivingGate, useDeleteDrivingGate } from '@/hooks/admin/useDrivingGates';
import { useLanes, useUpdateLane, useDeleteLane } from '@/hooks/admin/useLanes';
import { useStations, useUpdateStation, useDeleteStation } from '@/hooks/admin/useStations';
import { useRooms, useUpdateRoom, useDeleteRoom } from '@/hooks/admin/useRooms';
import { useOutsideAreas, useUpdateOutsideArea, useDeleteOutsideArea } from '@/hooks/admin/useOutsideAreas';
import { useStorageLocations, useUpdateStorageLocation, useDeleteStorageLocation } from '@/hooks/admin/useStorageLocations';
import { useZones, useUpdateZone, useDeleteZone } from '@/hooks/admin/useZones';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Plus, X, MapPin, Package, Box, Layers } from 'lucide-react';
import { UnifiedGridBuilder, type EditMode } from '@/components/facility/UnifiedGridBuilder';
import { LibraryPalette } from '@/components/facility/LibraryPalette';
import { CreateGateDialog } from '@/components/facility/dialogs/CreateGateDialog';
import { CreateLaneDialog } from '@/components/facility/dialogs/CreateLaneDialog';
import { CreateStationDialog } from '@/components/facility/dialogs/CreateStationDialog';
import { CreateRoomDialog } from '@/components/facility/dialogs/CreateRoomDialog';
import { CreateOutsideAreaDialog } from '@/components/facility/dialogs/CreateOutsideAreaDialog';
import { CreateStorageLocationDialog } from '@/components/facility/dialogs/CreateStorageLocationDialog';
import { CreateZoneDialog } from '@/components/facility/dialogs/CreateZoneDialog';
import { toast } from 'sonner';

export default function FacilityLayoutBuilderPageUnified() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState<EditMode>('room');
  const [selectedElement, setSelectedElement] = useState<{ type: string; id: string; data: any } | null>(null);
  
  const handleElementSelect = useCallback((element: { type: string; id: string; data: any } | null) => {
    setSelectedElement(element);
  }, []);
  
  // Dialog states for creating new elements
  const [showCreateGateDialog, setShowCreateGateDialog] = useState(false);
  const [showCreateLaneDialog, setShowCreateLaneDialog] = useState(false);
  const [showCreateStationDialog, setShowCreateStationDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [showCreateOutsideDialog, setShowCreateOutsideDialog] = useState(false);
  const [showCreateStorageDialog, setShowCreateStorageDialog] = useState(false);
  const [showCreateZoneDialog, setShowCreateZoneDialog] = useState(false);

  const { data: facilities, isLoading: loadingFacilities } = useFacilities();
  const { data: allDrivingGates } = useDrivingGates();
  const { data: allLanes } = useLanes();
  const { data: allStations } = useStations();
  const { data: allRooms } = useRooms(facilityId);
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

  const facility = facilities?.find(f => f.id === facilityId);

  const drivingGates = useMemo(
    () => allDrivingGates?.filter(g => g.facility_id === facility?.id) || [],
    [allDrivingGates, facility?.id]
  );

  const facilityLanes = useMemo(
    () => allLanes?.filter(lane => lane.facility_id === facility?.id) || [],
    [allLanes, facility?.id]
  );

  const facilityLaneIds = useMemo(
    () => facilityLanes.map(l => l.id),
    [facilityLanes]
  );

  const facilityStations = useMemo(
    () => allStations?.filter(station => facilityLaneIds.includes(station.lane_id)) || [],
    [allStations, facilityLaneIds]
  );

  // Memoize all array props to prevent infinite render loops
  const gatesData = useMemo(
    () => drivingGates.map(g => ({
      id: g.id,
      name: g.name,
      grid_x: g.grid_position_x,
      grid_y: g.grid_position_y,
      grid_width: g.grid_width,
      grid_height: g.grid_height,
    })),
    [drivingGates]
  );

  const lanesData = useMemo(
    () => facilityLanes.map(l => ({
      id: l.id,
      name: l.name,
      position_order: l.position_order,
      grid_y: l.grid_position_y,
      grid_height: l.grid_height,
    })),
    [facilityLanes]
  );

  const stationsData = useMemo(
    () => facilityStations.map(s => ({
      id: s.id,
      name: s.name,
      grid_x: s.grid_position_x,
      grid_y: s.grid_position_y,
      grid_width: s.grid_width,
      grid_height: s.grid_height,
    })),
    [facilityStations]
  );

  const roomsData = useMemo(
    () => allRooms?.map(r => ({
      id: r.id,
      name: r.name,
      grid_x: r.grid_position_x,
      grid_y: r.grid_position_y,
      grid_width: r.grid_width,
      grid_height: r.grid_height,
      color: r.color,
    })) || [],
    [allRooms]
  );

  const outsideAreasData = useMemo(
    () => allOutsideAreas?.map(a => ({
      id: a.id,
      name: a.name,
      grid_x: a.grid_position_x,
      grid_y: a.grid_position_y,
      grid_width: a.grid_width,
      grid_height: a.grid_height,
      color: a.color,
      area_type: a.area_type,
    })) || [],
    [allOutsideAreas]
  );

  const storageLocationsData = useMemo(
    () => allStorageLocations?.filter(s => s.lane_id && facilityLaneIds.includes(s.lane_id)).map(s => ({
      id: s.id,
      name: s.name,
      grid_x: s.grid_position_x,
      grid_y: s.grid_position_y,
      grid_width: s.grid_width,
      grid_height: s.grid_height,
      storage_type: s.storage_type,
      status: s.status,
    })) || [],
    [allStorageLocations, facilityLaneIds]
  );

  const zonesData = useMemo(
    () => allZones?.map(z => ({
      id: z.id,
      name: z.name,
      grid_x: z.grid_position_x,
      grid_y: z.grid_position_y,
      grid_width: z.grid_width,
      grid_height: z.grid_height,
      color: z.color,
      zone_type: z.zone_type,
    })) || [],
    [allZones]
  );

  if (loadingFacilities) {
    return <div className="flex items-center justify-center h-screen">Loading facility...</div>;
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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/facility-management')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold">{facility.name}</h1>
              <p className="text-sm text-muted-foreground">
                Layout Builder ({facility.grid_width}×{facility.grid_height})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['gate', 'lane', 'station', 'room', 'outside', 'storage', 'zone'] as EditMode[]).map(mode => (
              <Button
                key={mode}
                variant={editMode === mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
            
            {editMode !== 'view' && editMode !== 'facility' && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (editMode === 'gate') setShowCreateGateDialog(true);
                    else if (editMode === 'lane') setShowCreateLaneDialog(true);
                    else if (editMode === 'station') setShowCreateStationDialog(true);
                    else if (editMode === 'room') setShowCreateRoomDialog(true);
                    else if (editMode === 'outside') setShowCreateOutsideDialog(true);
                    else if (editMode === 'storage') setShowCreateStorageDialog(true);
                    else if (editMode === 'zone') setShowCreateZoneDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {editMode.charAt(0).toUpperCase() + editMode.slice(1)}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 flex gap-6 overflow-auto p-6">
        {/* Element Selection Sidebar */}
        <div className="flex-shrink-0 w-80 space-y-3">
          {/* Rooms */}
          {editMode === 'room' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Rooms in Facility</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to select</p>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {roomsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No rooms yet</p>
                  ) : (
                    roomsData.map((room) => (
                      <Button
                        key={room.id}
                        variant={selectedElement?.id === room.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2 h-auto py-2"
                        onClick={() => handleElementSelect({ id: room.id, type: 'room', data: { originalData: room } })}
                      >
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: room.color }} />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{room.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {room.grid_width} × {room.grid_height} at ({room.grid_x}, {room.grid_y})
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Gates */}
          {editMode === 'gate' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Gates in Facility</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to select</p>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {gatesData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No gates yet</p>
                  ) : (
                    gatesData.map((gate) => (
                      <Button
                        key={gate.id}
                        variant={selectedElement?.id === gate.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2 h-auto py-2"
                        onClick={() => handleElementSelect({ id: gate.id, type: 'gate', data: { originalData: gate } })}
                      >
                        <MapPin className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{gate.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {gate.grid_width} × {gate.grid_height}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Zones */}
          {editMode === 'zone' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Zones in Facility</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to select</p>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {zonesData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No zones yet</p>
                  ) : (
                    zonesData.map((zone) => (
                      <Button
                        key={zone.id}
                        variant={selectedElement?.id === zone.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2 h-auto py-2"
                        onClick={() => handleElementSelect({ id: zone.id, type: 'zone', data: { originalData: zone } })}
                      >
                        <Layers className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{zone.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {zone.grid_width} × {zone.grid_height}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stations */}
          {editMode === 'station' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Stations in Facility</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to select</p>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {stationsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No stations yet</p>
                  ) : (
                    stationsData.map((station) => (
                      <Button
                        key={station.id}
                        variant={selectedElement?.id === station.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2 h-auto py-2"
                        onClick={() => handleElementSelect({ id: station.id, type: 'station', data: { originalData: station } })}
                      >
                        <Box className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{station.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {station.grid_width} × {station.grid_height}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Storage Locations */}
          {editMode === 'storage' && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-semibold text-sm">Storage Locations</h3>
                <p className="text-xs text-muted-foreground mt-1">Click to select</p>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {storageLocationsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No storage locations yet</p>
                  ) : (
                    storageLocationsData.map((storage) => (
                      <Button
                        key={storage.id}
                        variant={selectedElement?.id === storage.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start gap-2 h-auto py-2"
                        onClick={() => handleElementSelect({ id: storage.id, type: 'storage', data: { originalData: storage } })}
                      >
                        <Package className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{storage.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {storage.grid_width} × {storage.grid_height}
                          </div>
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        {/* Canvas */}
        <div className="flex-1">
          <UnifiedGridBuilder
          gridWidth={facility.grid_width}
          gridHeight={facility.grid_height}
          gates={gatesData}
          lanes={lanesData}
          stations={stationsData}
          rooms={roomsData}
          outsideAreas={outsideAreasData}
          storageLocations={storageLocationsData}
          zones={zonesData}
          editMode={editMode}
          onGateMove={(id, x, y) => updateGate.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onLaneMove={(id, x, y) => updateLane.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onStationMove={(id, x, y) => updateStation.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onRoomMove={(id, x, y) => updateRoom.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onOutsideAreaMove={(id, x, y) => updateOutsideArea.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onStorageLocationMove={(id, x, y) => updateStorageLocation.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onZoneMove={(id, x, y) => updateZone.mutateAsync({ id, grid_position_x: x, grid_position_y: y } as any)}
          onGateResize={(id, w, h) => updateGate.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onLaneResize={(id, h) => updateLane.mutateAsync({ id, grid_height: h } as any)}
          onStationResize={(id, w, h) => updateStation.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onRoomResize={(id, w, h) => updateRoom.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onOutsideAreaResize={(id, w, h) => updateOutsideArea.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onStorageLocationResize={(id, w, h) => updateStorageLocation.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onZoneResize={(id, w, h) => updateZone.mutateAsync({ id, grid_width: w, grid_height: h } as any)}
          onElementSelect={handleElementSelect}
          />
        </div>
      </div>

      {/* Selected Element Info */}
      {selectedElement && (
        <div className="border-t bg-card">
          <div className="flex items-center justify-between px-6 py-3 border-b">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{selectedElement.type}</Badge>
              <div>
                <p className="font-semibold text-lg">
                  {selectedElement.data?.originalData?.name || 'Unnamed'}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID: {selectedElement.id}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedElement(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-4 px-6 py-4">
            {/* Position */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Position</p>
              <p className="font-mono text-sm">
                X: {selectedElement.data?.originalData?.grid_x || selectedElement.data?.originalData?.grid_position_x || 0}
                {', '}
                Y: {selectedElement.data?.originalData?.grid_y || selectedElement.data?.originalData?.grid_position_y || 0}
              </p>
            </div>
            
            {/* Dimensions */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Size</p>
              <p className="font-mono text-sm">
                {selectedElement.data?.originalData?.grid_width || 0}
                {' × '}
                {selectedElement.data?.originalData?.grid_height || 0}
              </p>
            </div>
            
            {/* Type-specific properties */}
            {selectedElement.type === 'room' && selectedElement.data?.originalData?.color && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Color</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: selectedElement.data.originalData.color }}
                  />
                  <p className="font-mono text-sm">
                    {selectedElement.data.originalData.color}
                  </p>
                </div>
              </div>
            )}
            
            {selectedElement.type === 'outside' && selectedElement.data?.originalData?.area_type && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Area Type</p>
                <Badge>{selectedElement.data.originalData.area_type}</Badge>
              </div>
            )}
            
            {selectedElement.type === 'storage' && (
              <>
                {selectedElement.data?.originalData?.storage_type && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Storage Type</p>
                    <Badge>{selectedElement.data.originalData.storage_type}</Badge>
                  </div>
                )}
                {selectedElement.data?.originalData?.status && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={
                      selectedElement.data.originalData.status === 'available' ? 'default' : 'secondary'
                    }>
                      {selectedElement.data.originalData.status}
                    </Badge>
                  </div>
                )}
              </>
            )}
            
            {selectedElement.type === 'zone' && selectedElement.data?.originalData?.zone_type && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Zone Type</p>
                <Badge>{selectedElement.data.originalData.zone_type}</Badge>
              </div>
            )}
            
            {selectedElement.type === 'lane' && selectedElement.data?.originalData?.position_order !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lane Order</p>
                <p className="font-mono text-sm">
                  #{selectedElement.data.originalData.position_order}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Creation Dialogs */}
      <CreateGateDialog
        open={showCreateGateDialog}
        onOpenChange={setShowCreateGateDialog}
        facilityId={facilityId!}
      />
      <CreateLaneDialog
        open={showCreateLaneDialog}
        onOpenChange={setShowCreateLaneDialog}
        facilityId={facilityId!}
      />
      <CreateStationDialog
        open={showCreateStationDialog}
        onOpenChange={setShowCreateStationDialog}
        lanes={facilityLanes.map(l => ({ id: l.id, name: l.name || `Lane ${l.position_order}` }))}
        facilityId={facilityId!}
      />
      <CreateRoomDialog
        open={showCreateRoomDialog}
        onOpenChange={setShowCreateRoomDialog}
        facilityId={facilityId!}
      />
      <CreateOutsideAreaDialog
        open={showCreateOutsideDialog}
        onOpenChange={setShowCreateOutsideDialog}
        facilityId={facilityId!}
      />
      <CreateStorageLocationDialog
        open={showCreateStorageDialog}
        onOpenChange={setShowCreateStorageDialog}
        lanes={facilityLanes.map(l => ({ id: l.id, name: l.name || `Lane ${l.position_order}` }))}
        facilityId={facilityId!}
      />
      <CreateZoneDialog
        open={showCreateZoneDialog}
        onOpenChange={setShowCreateZoneDialog}
        facilityId={facilityId}
      />
    </div>
  );
}
