import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanes, useCreateLane, useUpdateLane, useDeleteLane, type LaneWithCapabilities } from '@/hooks/admin/useLanes';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Lane } from '@/hooks/admin/useLanes';
import { Badge } from '@/components/ui/badge';

export default function Lanes() {
  const { data: lanes, isLoading } = useLanes();
  const { data: facilities } = useFacilities();
  const createLane = useCreateLane();
  const updateLane = useUpdateLane();
  const deleteLane = useDeleteLane();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<LaneWithCapabilities | null>(null);
  const [formData, setFormData] = useState({
    facility_id: '',
    name: '',
    position_order: 0,
    grid_position_y: 0,
    grid_height: 2,
    open_time: '',
    close_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      open_time: formData.open_time || null,
      close_time: formData.close_time || null,
    };
    
    if (editingLane) {
      await updateLane.mutateAsync({ id: editingLane.id, ...submitData });
      setEditingLane(null);
    } else {
      await createLane.mutateAsync(submitData);
      setIsCreateOpen(false);
    }
    
    setFormData({
      facility_id: '',
      name: '',
      position_order: 0,
      grid_position_y: 0,
      grid_height: 2,
      open_time: '',
      close_time: '',
    });
  };

  const handleEdit = (lane: LaneWithCapabilities) => {
    setEditingLane(lane);
    setFormData({
      facility_id: lane.facility_id,
      name: lane.name,
      position_order: lane.position_order,
      grid_position_y: lane.grid_position_y,
      grid_height: lane.grid_height,
      open_time: lane.open_time || '',
      close_time: lane.close_time || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lane? All stations will be removed.')) {
      await deleteLane.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lanes</h1>
          <p className="text-muted-foreground mt-1">Manage service lanes within driving gates</p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lane
        </Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lanes?.map((lane) => (
            <Card key={lane.id}>
              <CardHeader>
                <CardTitle>{lane.name}</CardTitle>
                <CardDescription>
                  {lane.facility?.name || 'No facility'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><strong>Position:</strong> {lane.position_order}</p>
                  <p><strong>Stations:</strong> {lane.stations?.length || 0}</p>
                  {lane.open_time && lane.close_time && (
                    <p><strong>Hours:</strong> {lane.open_time} - {lane.close_time}</p>
                  )}
                  {lane.closed_for_new_bookings_at && (
                    <Badge variant="destructive">Closed for new bookings</Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(lane)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(lane.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(isCreateOpen || editingLane) && (
        <Dialog open={isCreateOpen || !!editingLane} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingLane(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLane ? 'Edit Lane' : 'Create Lane'}</DialogTitle>
              <DialogDescription>
                {editingLane ? 'Update lane details' : 'Add a new lane to a driving gate'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="facility_id">Facility</Label>
                <Select 
                  value={formData.facility_id} 
                  onValueChange={(value) => setFormData({ ...formData, facility_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities?.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Lane Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position_order">Position Order</Label>
                  <Input
                    id="position_order"
                    type="number"
                    value={formData.position_order}
                    onChange={(e) => setFormData({ ...formData, position_order: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="grid_height">Grid Height</Label>
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
              <Button type="submit" className="w-full" disabled={createLane.isPending || updateLane.isPending}>
                {editingLane ? 'Update Lane' : 'Create Lane'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
