import { useState } from 'react';
import { useLibraryStations, useCreateStation, useUpdateStation, useDeleteStation, Station } from '@/hooks/admin/useStations';
import { useCapabilities } from '@/hooks/admin/useCapabilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Library } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function StationsLibrary() {
  const { data: stations, isLoading } = useLibraryStations();
  const { data: capabilities } = useCapabilities();
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    station_type: 'general',
    grid_width: 2,
    grid_height: 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingStation) {
      await updateStation.mutateAsync({
        id: editingStation.id,
        ...formData,
      });
      setEditingStation(null);
    } else {
      await createStation.mutateAsync({
        ...formData,
        lane_id: null, // Library item - not assigned to lane
        grid_position_x: 0,
        grid_position_y: 0,
        active: true,
      });
      setIsCreateOpen(false);
    }

    setFormData({
      name: '',
      description: '',
      station_type: 'general',
      grid_width: 2,
      grid_height: 2,
    });
  };

  const handleEdit = (station: Station) => {
    setFormData({
      name: station.name,
      description: station.description || '',
      station_type: station.station_type,
      grid_width: station.grid_width,
      grid_height: station.grid_height,
    });
    setEditingStation(station);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this station? This action cannot be undone.')) {
      await deleteStation.mutateAsync(id);
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
          <h1 className="text-3xl font-bold">Stations Library</h1>
          <p className="text-muted-foreground">
            Manage station templates that can be placed in lanes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Station
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStation ? 'Edit Station' : 'Create New Station'}</DialogTitle>
              <DialogDescription>
                {editingStation 
                  ? 'Update the station configuration. It will remain in the library.' 
                  : 'Create a new station in the library. You can assign it to a lane later.'}
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
                  placeholder="e.g., Tire Change Station, Brake Inspection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional description of the station"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Station Type</Label>
                <Select
                  value={formData.station_type}
                  onValueChange={(value) => setFormData({ ...formData, station_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (grid units)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="1"
                    max="10"
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
                    max="10"
                    value={formData.grid_height}
                    onChange={(e) => setFormData({ ...formData, grid_height: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false);
                  setEditingStation(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStation ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stations && stations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No stations in library</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create station templates that you can reuse across lanes
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Station
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stations?.map((station) => (
            <Card key={station.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{station.name}</CardTitle>
                    <CardDescription>
                      {station.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(station)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(station.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{station.station_type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">{station.grid_width} × {station.grid_height}</span>
                  </div>
                  {station.capabilities && station.capabilities.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Capabilities:</span>
                      <div className="flex flex-wrap gap-1">
                        {station.capabilities.map((cap) => (
                          <Badge key={cap.id} variant="secondary" className="text-xs">
                            {cap.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
