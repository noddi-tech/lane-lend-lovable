import { useState } from 'react';
import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom, Room } from '@/hooks/admin/useRooms';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Building2, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export default function Rooms() {
  const { data: rooms, isLoading } = useRooms();
  const { data: facilities } = useFacilities();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    facility_id: '',
    grid_position_x: 0,
    grid_position_y: 0,
    grid_width: 20,
    grid_height: 20,
    color: '#3b82f6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRoom) {
      await updateRoom.mutateAsync({
        id: editingRoom.id,
        ...formData,
      });
      setEditingRoom(null);
    } else {
      await createRoom.mutateAsync(formData);
      setIsCreateOpen(false);
    }

    setFormData({
      name: '',
      description: '',
      facility_id: '',
      grid_position_x: 0,
      grid_position_y: 0,
      grid_width: 20,
      grid_height: 20,
      color: '#3b82f6',
    });
  };

  const handleEdit = (room: Room) => {
    setFormData({
      name: room.name,
      description: room.description || '',
      facility_id: room.facility_id,
      grid_position_x: room.grid_position_x,
      grid_position_y: room.grid_position_y,
      grid_width: room.grid_width,
      grid_height: room.grid_height,
      color: room.color,
    });
    setEditingRoom(room);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this room? Elements in this room will not be deleted, but will be unassigned.')) {
      await deleteRoom.mutateAsync(id);
    }
  };

  const handleNavigateToFacility = (facilityId: string) => {
    navigate(`/admin/facilities/${facilityId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rooms</h1>
          <p className="text-muted-foreground">
            Manage rooms (sub-facilities) across all facilities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Edit Room' : 'Create New Room'}</DialogTitle>
              <DialogDescription>
                {editingRoom 
                  ? 'Update the room configuration.' 
                  : 'Create a new room within a facility. Rooms help organize gates, lanes, and stations.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facility">Facility</Label>
                <Select
                  value={formData.facility_id}
                  onValueChange={(value) => setFormData({ ...formData, facility_id: value })}
                  required
                  disabled={!!editingRoom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities?.map(facility => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Workshop Area, Inspection Zone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (grid units)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.grid_width}
                    onChange={(e) => setFormData({ ...formData, grid_width: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (grid units)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="5"
                    max="100"
                    value={formData.grid_height}
                    onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pos_x">Position X</Label>
                  <Input
                    id="pos_x"
                    type="number"
                    min="0"
                    value={formData.grid_position_x}
                    onChange={(e) => setFormData({ ...formData, grid_position_x: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos_y">Position Y</Label>
                  <Input
                    id="pos_y"
                    type="number"
                    min="0"
                    value={formData.grid_position_y}
                    onChange={(e) => setFormData({ ...formData, grid_position_y: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingRoom(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRoom ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rooms && rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No rooms created</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create rooms to organize areas within your facilities
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms?.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-4 h-4 rounded border" 
                        style={{ backgroundColor: room.color, borderColor: room.color }}
                      />
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {room.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(room.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {room.facility && (
                    <div>
                      <span className="text-muted-foreground">Facility:</span>
                      <div className="mt-1">
                        <Badge 
                          variant="outline" 
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleNavigateToFacility(room.facility_id)}
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          {room.facility.name}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">{room.grid_width} × {room.grid_height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-medium">({room.grid_position_x}, {room.grid_position_y})</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => handleNavigateToFacility(room.facility_id)}
                  >
                    <MapPin className="h-3 w-3 mr-2" />
                    View in Facility
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
