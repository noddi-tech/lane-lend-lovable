import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStations, useCreateStation, useUpdateStation, useDeleteStation } from '@/hooks/admin/useStations';
import { useLanes } from '@/hooks/admin/useLanes';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Station } from '@/hooks/admin/useStations';

const STATION_TYPES = [
  { value: 'lifting_jack', label: 'Lifting Jack', icon: '🔧' },
  { value: 'tire_mount', label: 'Tire Mount', icon: '🔩' },
  { value: 'diagnostic', label: 'Diagnostic', icon: '💻' },
  { value: 'alignment', label: 'Wheel Alignment', icon: '📐' },
  { value: 'general', label: 'General Service', icon: '🛠️' },
];

export default function Stations() {
  const { data: stations, isLoading } = useStations();
  const { data: lanes } = useLanes();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
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
    active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      open_time: formData.open_time || null,
      close_time: formData.close_time || null,
    };
    
    if (editingStation) {
      await updateStation.mutateAsync({ id: editingStation.id, ...submitData });
      setEditingStation(null);
    } else {
      await createStation.mutateAsync(submitData);
      setIsCreateOpen(false);
    }
    
    setFormData({
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
      active: true,
    });
  };

  const handleEdit = (station: any) => {
    setEditingStation(station);
    setFormData({
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
      active: station.active,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this station?')) {
      await deleteStation.mutateAsync(id);
    }
  };

  const getStationTypeIcon = (type: string) => {
    return STATION_TYPES.find(t => t.value === type)?.icon || '🛠️';
  };

  const getStationTypeLabel = (type: string) => {
    return STATION_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stations</h1>
          <p className="text-muted-foreground mt-1">Manage service stations across all lanes</p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Station
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stations?.map((station: any) => (
            <Card key={station.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{getStationTypeIcon(station.station_type)}</span>
                  {station.name}
                </CardTitle>
                <CardDescription>
                  {station.lane?.name || 'No lane assigned'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><strong>Type:</strong> {getStationTypeLabel(station.station_type)}</p>
                  <p><strong>Size:</strong> {station.grid_width} × {station.grid_height}</p>
                  {station.open_time && station.close_time && (
                    <p><strong>Hours:</strong> {station.open_time} - {station.close_time}</p>
                  )}
                  <div className="flex items-center gap-1 flex-wrap">
                    <strong>Capabilities:</strong>
                    {station.capabilities?.length > 0 ? (
                      station.capabilities.map((cap: any) => (
                        <Badge key={cap.id} variant="secondary">{cap.name}</Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(station)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(station.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(isCreateOpen || editingStation) && (
        <Dialog open={isCreateOpen || !!editingStation} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingStation(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStation ? 'Edit Station' : 'Create Station'}</DialogTitle>
              <DialogDescription>
                {editingStation ? 'Update station details' : 'Add a new service station to a lane'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lane_id">Lane</Label>
                  <Select value={formData.lane_id} onValueChange={(value) => setFormData({ ...formData, lane_id: value })}>
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
                  <Label htmlFor="station_type">Station Type</Label>
                  <Select value={formData.station_type} onValueChange={(value) => setFormData({ ...formData, station_type: value })}>
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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="grid_width">Width (cells)</Label>
                  <Input
                    id="grid_width"
                    type="number"
                    min="1"
                    value={formData.grid_width}
                    onChange={(e) => setFormData({ ...formData, grid_width: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="grid_height">Height (cells)</Label>
                  <Input
                    id="grid_height"
                    type="number"
                    min="1"
                    value={formData.grid_height}
                    onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="open_time">Open Time (optional)</Label>
                  <Input
                    id="open_time"
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="close_time">Close Time (optional)</Label>
                  <Input
                    id="close_time"
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createStation.isPending || updateStation.isPending}>
                {editingStation ? 'Update Station' : 'Create Station'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
