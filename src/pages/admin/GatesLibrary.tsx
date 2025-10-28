import { useState } from 'react';
import { useLibraryGates, useCreateDrivingGate, useUpdateDrivingGate, useDeleteDrivingGate, DrivingGate } from '@/hooks/admin/useDrivingGates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GatesLibrary() {
  const { data: gates, isLoading } = useLibraryGates();
  const createGate = useCreateDrivingGate();
  const updateGate = useUpdateDrivingGate();
  const deleteGate = useDeleteDrivingGate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<DrivingGate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grid_width: 20,
    grid_height: 10,
    open_time: '08:00:00',
    close_time: '17:00:00',
    time_zone: 'Europe/Oslo',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGate) {
      await updateGate.mutateAsync({
        id: editingGate.id,
        ...formData,
      });
      setEditingGate(null);
    } else {
      await createGate.mutateAsync({
        ...formData,
        facility_id: null, // Library item - not assigned to facility
        grid_position_x: 0,
        grid_position_y: 0,
      });
      setIsCreateOpen(false);
    }

    setFormData({
      name: '',
      description: '',
      grid_width: 20,
      grid_height: 10,
      open_time: '08:00:00',
      close_time: '17:00:00',
      time_zone: 'Europe/Oslo',
    });
  };

  const handleEdit = (gate: DrivingGate) => {
    setFormData({
      name: gate.name,
      description: gate.description || '',
      grid_width: gate.grid_width,
      grid_height: gate.grid_height,
      open_time: gate.open_time,
      close_time: gate.close_time,
      time_zone: gate.time_zone,
    });
    setEditingGate(gate);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this gate? This action cannot be undone.')) {
      await deleteGate.mutateAsync(id);
    }
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
          <h1 className="text-3xl font-bold">Gates Library</h1>
          <p className="text-muted-foreground">
            Manage gate templates that can be placed in facilities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Gate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGate ? 'Edit Gate' : 'Create New Gate'}</DialogTitle>
              <DialogDescription>
                {editingGate 
                  ? 'Update the gate configuration. It will remain in the library.' 
                  : 'Create a new gate in the library. You can assign it to a facility later.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (grid units)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="1"
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
                    min="1"
                    max="100"
                    value={formData.grid_height}
                    onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="open_time">Open Time</Label>
                  <Input
                    id="open_time"
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_time">Close Time</Label>
                  <Input
                    id="close_time"
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingGate(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {gates && gates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No gates in library</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create gate templates that you can reuse across facilities
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Gate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gates?.map((gate) => (
            <Card key={gate.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gate.name}</CardTitle>
                    <CardDescription>
                      {gate.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(gate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(gate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">{gate.grid_width} × {gate.grid_height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours:</span>
                    <span className="font-medium">{gate.open_time} - {gate.close_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{gate.time_zone}</span>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-md text-center">
                    <Library className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Ready to place</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
