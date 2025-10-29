import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFacility, useDeleteFacility } from '@/hooks/admin/useFacilities';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import { Settings, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FacilityConfigurationProps {
  facility: FacilityWithGates;
}

export function FacilityConfiguration({ facility }: FacilityConfigurationProps) {
  const navigate = useNavigate();
  const updateFacility = useUpdateFacility();
  const deleteFacility = useDeleteFacility();

  const [formData, setFormData] = useState({
    name: facility.name,
    description: facility.description || '',
    grid_width: facility.grid_width,
    grid_height: facility.grid_height,
    time_zone: facility.time_zone,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFacility.mutateAsync({
      ...formData,
      id: facility.id,
    });
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${facility.name}"? This will also delete all driving gates, lanes, and stations within it.`)) {
      await deleteFacility.mutateAsync(facility.id);
      navigate('/admin/facility-management');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Facility Settings
          </CardTitle>
          <CardDescription>Update facility configuration and properties</CardDescription>
        </CardHeader>
        <CardContent>
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
                rows={3}
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

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive" id="danger-zone">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete this facility and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete} className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Facility
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
