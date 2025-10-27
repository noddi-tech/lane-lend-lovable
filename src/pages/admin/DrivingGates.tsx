import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDrivingGates, useCreateDrivingGate, useUpdateDrivingGate, useDeleteDrivingGate } from '@/hooks/admin/useDrivingGates';
import { Plus, Edit, Trash2, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DrivingGate } from '@/hooks/admin/useDrivingGates';

export default function DrivingGates() {
  const navigate = useNavigate();
  const { data: gates, isLoading } = useDrivingGates();
  const createGate = useCreateDrivingGate();
  const updateGate = useUpdateDrivingGate();
  const deleteGate = useDeleteDrivingGate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGate, setEditingGate] = useState<DrivingGate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    time_zone: 'Europe/Oslo',
    grid_width: 30,
    grid_height: 20,
    open_time: '08:00:00',
    close_time: '17:00:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGate) {
      await updateGate.mutateAsync({ id: editingGate.id, ...formData });
      setEditingGate(null);
    } else {
      await createGate.mutateAsync(formData);
      setIsCreateOpen(false);
    }
    
    setFormData({
      name: '',
      description: '',
      time_zone: 'Europe/Oslo',
      grid_width: 30,
      grid_height: 20,
      open_time: '08:00:00',
      close_time: '17:00:00',
    });
  };

  const handleEdit = (gate: DrivingGate) => {
    setEditingGate(gate);
    setFormData({
      name: gate.name,
      description: gate.description || '',
      time_zone: gate.time_zone,
      grid_width: gate.grid_width,
      grid_height: gate.grid_height,
      open_time: gate.open_time,
      close_time: gate.close_time,
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this driving gate? All lanes and stations will be removed.')) {
      await deleteGate.mutateAsync(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Driving Gates</h1>
            <p className="text-muted-foreground mt-1">Manage service area driving gates (kjøreporter)</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Driving Gate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Driving Gate</DialogTitle>
                <DialogDescription>Add a new driving gate to your service area</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grid_width">Grid Width</Label>
                    <Input
                      id="grid_width"
                      type="number"
                      min="10"
                      max="100"
                      value={formData.grid_width}
                      onChange={(e) => setFormData({ ...formData, grid_width: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="grid_height">Grid Height</Label>
                    <Input
                      id="grid_height"
                      type="number"
                      min="10"
                      max="100"
                      value={formData.grid_height}
                      onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="open_time">Open Time</Label>
                    <Input
                      id="open_time"
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="close_time">Close Time</Label>
                    <Input
                      id="close_time"
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createGate.isPending}>
                  Create Gate
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gates?.map((gate) => (
              <Card key={gate.id}>
                <CardHeader>
                  <CardTitle>{gate.name}</CardTitle>
                  <CardDescription>{gate.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm space-y-1">
                    <p><strong>Lanes:</strong> {gate.lanes?.length || 0}</p>
                    <p><strong>Grid:</strong> {gate.grid_width} × {gate.grid_height}</p>
                    <p><strong>Hours:</strong> {gate.open_time} - {gate.close_time}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/admin/driving-gates/${gate.id}/layout`)}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Layout
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(gate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(gate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingGate && (
          <Dialog open={!!editingGate} onOpenChange={() => setEditingGate(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Driving Gate</DialogTitle>
                <DialogDescription>Update driving gate details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-grid_width">Grid Width</Label>
                    <Input
                      id="edit-grid_width"
                      type="number"
                      min="10"
                      max="100"
                      value={formData.grid_width}
                      onChange={(e) => setFormData({ ...formData, grid_width: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-grid_height">Grid Height</Label>
                    <Input
                      id="edit-grid_height"
                      type="number"
                      min="10"
                      max="100"
                      value={formData.grid_height}
                      onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-open_time">Open Time</Label>
                    <Input
                      id="edit-open_time"
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-close_time">Close Time</Label>
                    <Input
                      id="edit-close_time"
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={updateGate.isPending}>
                  Update Gate
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
