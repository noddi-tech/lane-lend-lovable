import { useState } from 'react';
import { useLibraryLanes, useCreateLane, useUpdateLane, useDeleteLane, Lane } from '@/hooks/admin/useLanes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LanesLibrary() {
  const { data: lanes, isLoading } = useLibraryLanes();
  const createLane = useCreateLane();
  const updateLane = useUpdateLane();
  const deleteLane = useDeleteLane();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grid_height: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingLane) {
      await updateLane.mutateAsync({
        id: editingLane.id,
        ...formData,
      });
      setEditingLane(null);
    } else {
      await createLane.mutateAsync({
        ...formData,
        facility_id: null, // Library item - not assigned to facility
        grid_position_y: 0,
        position_order: 0,
      });
      setIsCreateOpen(false);
    }

    setFormData({
      name: '',
      grid_height: 2,
    });
  };

  const handleEdit = (lane: Lane) => {
    setFormData({
      name: lane.name,
      grid_height: lane.grid_height,
    });
    setEditingLane(lane);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lane? This action cannot be undone.')) {
      await deleteLane.mutateAsync(id);
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
          <h1 className="text-3xl font-bold">Lanes Library</h1>
          <p className="text-muted-foreground">
            Manage lane templates that can be placed in facilities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Lane
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLane ? 'Edit Lane' : 'Create New Lane'}</DialogTitle>
              <DialogDescription>
                {editingLane 
                  ? 'Update the lane configuration. It will remain in the library.' 
                  : 'Create a new lane in the library. You can assign it to a facility later.'}
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
                  placeholder="e.g., Express Lane, Standard Service Lane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (grid units)</Label>
                <Input
                  id="height"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.grid_height}
                  onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Typical lane height is 2-4 grid units
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingLane(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingLane ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lanes && lanes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lanes in library</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create lane templates that you can reuse across facilities
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Lane
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lanes?.map((lane) => (
            <Card key={lane.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{lane.name}</CardTitle>
                    <CardDescription>
                      Lane template
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lane)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(lane.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Height:</span>
                    <span className="font-medium">{lane.grid_height} units</span>
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
