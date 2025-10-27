import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacilities, useCreateFacility, useUpdateFacility, useDeleteFacility, Facility } from '@/hooks/admin/useFacilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, Edit, Trash2, MapPin } from 'lucide-react';

export default function Facilities() {
  const navigate = useNavigate();
  const { data: facilities, isLoading } = useFacilities();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();
  const deleteFacility = useDeleteFacility();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grid_width: 100,
    grid_height: 100,
    time_zone: 'Europe/Oslo',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingFacility) {
      await updateFacility.mutateAsync({ ...formData, id: editingFacility.id });
    } else {
      await createFacility.mutateAsync(formData);
    }
    
    setIsCreateOpen(false);
    setEditingFacility(null);
    setFormData({ name: '', description: '', grid_width: 100, grid_height: 100, time_zone: 'Europe/Oslo' });
  };

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      description: facility.description || '',
      grid_width: facility.grid_width,
      grid_height: facility.grid_height,
      time_zone: facility.time_zone,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this facility? This will also delete all driving gates within it.')) {
      await deleteFacility.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facilities</h1>
          <p className="text-muted-foreground mt-1">
            Manage your service facilities and their floor plans
          </p>
        </div>
        <Button onClick={() => {
          setEditingFacility(null);
          setFormData({ name: '', description: '', grid_width: 100, grid_height: 100, time_zone: 'Europe/Oslo' });
          setIsCreateOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Facility
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {facilities?.map((facility) => (
          <Card key={facility.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(facility)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(facility.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle>{facility.name}</CardTitle>
              <CardDescription>
                {facility.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Grid Size:</span>
                <span className="font-medium">{facility.grid_width} × {facility.grid_height}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Driving Gates:</span>
                <span className="font-medium">{facility.driving_gates?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Zone:</span>
                <span className="font-medium">{facility.time_zone}</span>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => navigate(`/admin/facilities/${facility.id}`)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Floor Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFacility ? 'Edit Facility' : 'Create New Facility'}</DialogTitle>
            <DialogDescription>
              {editingFacility ? 'Update facility details' : 'Add a new service facility to your system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Facility Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Service Center"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this facility"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grid_width">Grid Width</Label>
                <Input
                  id="grid_width"
                  type="number"
                  min="10"
                  max="200"
                  value={formData.grid_width}
                  onChange={(e) => setFormData({ ...formData, grid_width: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="grid_height">Grid Height</Label>
                <Input
                  id="grid_height"
                  type="number"
                  min="10"
                  max="200"
                  value={formData.grid_height}
                  onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="time_zone">Time Zone</Label>
              <Input
                id="time_zone"
                value={formData.time_zone}
                onChange={(e) => setFormData({ ...formData, time_zone: e.target.value })}
                placeholder="e.g., Europe/Oslo"
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFacility ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
