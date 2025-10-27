import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrivingGates } from '@/hooks/admin/useDrivingGates';
import { useLanes, useCreateLane } from '@/hooks/admin/useLanes';
import { useStations, useCreateStation, useUpdateStation, useDeleteStation, useAssignCapabilityToStation, useRemoveCapabilityFromStation } from '@/hooks/admin/useStations';
import { useCapabilities } from '@/hooks/admin/useCapabilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Edit, Trash2, Grid3x3, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Station } from '@/hooks/admin/useStations';

const STATION_TYPES = [
  { value: 'lifting_jack', label: 'Lifting Jack', icon: '🔧' },
  { value: 'tire_mount', label: 'Tire Mount', icon: '🔩' },
  { value: 'diagnostic', label: 'Diagnostic', icon: '💻' },
  { value: 'alignment', label: 'Wheel Alignment', icon: '📐' },
  { value: 'general', label: 'General Service', icon: '🛠️' },
];

export default function DrivingGateLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: gates } = useDrivingGates();
  const { data: lanes } = useLanes(id);
  const { data: allStations } = useStations();
  const { data: capabilities } = useCapabilities();
  
  const createLane = useCreateLane();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();
  const assignCapability = useAssignCapabilityToStation();
  const removeCapability = useRemoveCapabilityFromStation();

  const gate = gates?.find(g => g.id === id);
  const gateStations = allStations?.filter(s => 
    lanes?.some(l => l.id === s.lane_id)
  );

  const [isAddLaneOpen, setIsAddLaneOpen] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [selectedLaneId, setSelectedLaneId] = useState<string>('');
  const [expandedLanes, setExpandedLanes] = useState<Set<string>>(new Set());
  
  const [laneFormData, setLaneFormData] = useState({
    name: '',
    position_order: 0,
  });

  const [stationFormData, setStationFormData] = useState({
    lane_id: '',
    name: '',
    description: '',
    station_type: 'general',
    grid_position_x: 0,
    grid_position_y: 0,
    grid_width: 2,
    grid_height: 2,
    open_time: '',
    close_time: '',
  });

  const handleAddLane = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    await createLane.mutateAsync({
      driving_gate_id: id,
      ...laneFormData,
      grid_position_y: (lanes?.length || 0) * 3,
      grid_height: 2,
    });
    
    setLaneFormData({ name: '', position_order: 0 });
    setIsAddLaneOpen(false);
  };

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...stationFormData,
      open_time: stationFormData.open_time || null,
      close_time: stationFormData.close_time || null,
    };
    
    if (editingStation) {
      await updateStation.mutateAsync({ id: editingStation.id, ...submitData });
      setEditingStation(null);
    } else {
      await createStation.mutateAsync(submitData);
      setIsAddStationOpen(false);
    }
    
    setStationFormData({
      lane_id: '',
      name: '',
      description: '',
      station_type: 'general',
      grid_position_x: 0,
      grid_position_y: 0,
      grid_width: 2,
      grid_height: 2,
      open_time: '',
      close_time: '',
    });
  };

  const handleEditStation = (station: any) => {
    setEditingStation(station);
    setStationFormData({
      lane_id: station.lane_id,
      name: station.name,
      description: station.description || '',
      station_type: station.station_type,
      grid_position_x: station.grid_position_x,
      grid_position_y: station.grid_position_y,
      grid_width: station.grid_width,
      grid_height: station.grid_height,
      open_time: station.open_time || '',
      close_time: station.close_time || '',
    });
  };

  const handleDeleteStation = async (stationId: string) => {
    if (confirm('Are you sure you want to delete this station?')) {
      await deleteStation.mutateAsync(stationId);
    }
  };

  const handleAssignCapability = async (stationId: string, capabilityId: string) => {
    await assignCapability.mutateAsync({ stationId, capabilityId });
  };

  const handleRemoveCapability = async (stationId: string, capabilityId: string) => {
    await removeCapability.mutateAsync({ stationId, capabilityId });
  };

  const toggleLane = (laneId: string) => {
    const newExpanded = new Set(expandedLanes);
    if (newExpanded.has(laneId)) {
      newExpanded.delete(laneId);
    } else {
      newExpanded.add(laneId);
    }
    setExpandedLanes(newExpanded);
  };

  const getStationTypeIcon = (type: string) => {
    return STATION_TYPES.find(t => t.value === type)?.icon || '🛠️';
  };

  const getStationTypeLabel = (type: string) => {
    return STATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStationsForLane = (laneId: string) => {
    return gateStations?.filter(s => s.lane_id === laneId) || [];
  };

  const getAvailableCapabilities = (stationCapabilities: any[]) => {
    const stationCapIds = stationCapabilities.map(c => c.id);
    return capabilities?.filter(cap => !stationCapIds.includes(cap.id)) || [];
  };

  if (!gate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/driving-gates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/driving-gates')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{gate.name} - Layout</h1>
            <p className="text-muted-foreground mt-1">
              Grid: {gate.grid_width} × {gate.grid_height} | Hours: {gate.open_time} - {gate.close_time}
            </p>
          </div>
        </div>
        
        <Button onClick={() => setIsAddLaneOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lane
        </Button>
      </div>

      <Separator />

      {/* Lanes List */}
      <div className="space-y-4">
        {lanes?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lanes yet. Click "Add Lane" to create your first lane.
            </CardContent>
          </Card>
        ) : (
          lanes?.map((lane) => (
            <Card key={lane.id} className="overflow-hidden">
              <Collapsible
                open={expandedLanes.has(lane.id)}
                onOpenChange={() => toggleLane(lane.id)}
              >
                <CardHeader className="cursor-pointer" onClick={() => toggleLane(lane.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{lane.name}</CardTitle>
                      <CardDescription>
                        Position: {lane.position_order} | Stations: {getStationsForLane(lane.id).length}
                        {lane.open_time && ` | ${lane.open_time} - ${lane.close_time}`}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLaneId(lane.id);
                        setStationFormData({ ...stationFormData, lane_id: lane.id });
                        setIsAddStationOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Station
                    </Button>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getStationsForLane(lane.id).map((station: any) => (
                        <Card key={station.id} className="border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{getStationTypeIcon(station.station_type)}</span>
                                <div>
                                  <CardTitle className="text-base">{station.name}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {getStationTypeLabel(station.station_type)}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStation(station)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStation(station.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Grid3x3 className="h-3 w-3" />
                              <span>
                                Position: ({station.grid_position_x}, {station.grid_position_y}) | 
                                Size: {station.grid_width}×{station.grid_height}
                              </span>
                            </div>
                            
                            {station.open_time && station.close_time && (
                              <div className="text-muted-foreground">
                                Hours: {station.open_time} - {station.close_time}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold">Capabilities:</span>
                                {getAvailableCapabilities(station.capabilities || []).length > 0 && (
                                  <Select
                                    onValueChange={(capId) => handleAssignCapability(station.id, capId)}
                                  >
                                    <SelectTrigger className="h-6 w-24 text-xs">
                                      <SelectValue placeholder="Add" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getAvailableCapabilities(station.capabilities || []).map((cap) => (
                                        <SelectItem key={cap.id} value={cap.id} className="text-xs">
                                          {cap.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {station.capabilities && station.capabilities.length > 0 ? (
                                  station.capabilities.map((cap: any) => (
                                    <Badge key={cap.id} variant="secondary" className="text-xs">
                                      {cap.name}
                                      <button
                                        onClick={() => handleRemoveCapability(station.id, cap.id)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <X className="h-2 w-2" />
                                      </button>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">None assigned</span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {getStationsForLane(lane.id).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No stations in this lane yet.
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Add Lane Dialog */}
      <Dialog open={isAddLaneOpen} onOpenChange={setIsAddLaneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lane</DialogTitle>
            <DialogDescription>Create a new lane in this driving gate</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLane} className="space-y-4">
            <div>
              <Label htmlFor="lane-name">Lane Name</Label>
              <Input
                id="lane-name"
                value={laneFormData.name}
                onChange={(e) => setLaneFormData({ ...laneFormData, name: e.target.value })}
                placeholder="e.g., Express Service Lane"
                required
              />
            </div>
            <div>
              <Label htmlFor="position">Position Order</Label>
              <Input
                id="position"
                type="number"
                value={laneFormData.position_order}
                onChange={(e) => setLaneFormData({ ...laneFormData, position_order: parseInt(e.target.value) })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createLane.isPending}>
              Create Lane
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Station Dialog */}
      <Dialog open={isAddStationOpen || !!editingStation} onOpenChange={(open) => {
        if (!open) {
          setIsAddStationOpen(false);
          setEditingStation(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStation ? 'Edit Station' : 'Add Station'}</DialogTitle>
            <DialogDescription>
              {editingStation ? 'Update station details and position' : 'Create a new station with manual grid positioning'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStation} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="station-lane">Lane</Label>
                <Select 
                  value={stationFormData.lane_id} 
                  onValueChange={(value) => setStationFormData({ ...stationFormData, lane_id: value })}
                  disabled={!!editingStation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {lanes?.map((lane) => (
                      <SelectItem key={lane.id} value={lane.id}>
                        {lane.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="station-type">Station Type</Label>
                <Select 
                  value={stationFormData.station_type} 
                  onValueChange={(value) => setStationFormData({ ...stationFormData, station_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="station-name">Station Name</Label>
              <Input
                id="station-name"
                value={stationFormData.name}
                onChange={(e) => setStationFormData({ ...stationFormData, name: e.target.value })}
                placeholder="e.g., Jack Station 1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={stationFormData.description}
                onChange={(e) => setStationFormData({ ...stationFormData, description: e.target.value })}
                placeholder="Additional details"
              />
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="text-base">Grid Position & Size</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grid-x">X Position</Label>
                  <Input
                    id="grid-x"
                    type="number"
                    min="0"
                    value={stationFormData.grid_position_x}
                    onChange={(e) => setStationFormData({ ...stationFormData, grid_position_x: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="grid-y">Y Position</Label>
                  <Input
                    id="grid-y"
                    type="number"
                    min="0"
                    value={stationFormData.grid_position_y}
                    onChange={(e) => setStationFormData({ ...stationFormData, grid_position_y: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="grid-width">Width (cells)</Label>
                  <Input
                    id="grid-width"
                    type="number"
                    min="1"
                    value={stationFormData.grid_width}
                    onChange={(e) => setStationFormData({ ...stationFormData, grid_width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="grid-height">Height (cells)</Label>
                  <Input
                    id="grid-height"
                    type="number"
                    min="1"
                    value={stationFormData.grid_height}
                    onChange={(e) => setStationFormData({ ...stationFormData, grid_height: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-2">
              <Label className="text-base">Operating Hours (optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="open-time">Open Time</Label>
                  <Input
                    id="open-time"
                    type="time"
                    value={stationFormData.open_time}
                    onChange={(e) => setStationFormData({ ...stationFormData, open_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="close-time">Close Time</Label>
                  <Input
                    id="close-time"
                    type="time"
                    value={stationFormData.close_time}
                    onChange={(e) => setStationFormData({ ...stationFormData, close_time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createStation.isPending || updateStation.isPending}>
              {editingStation ? 'Update Station' : 'Create Station'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
