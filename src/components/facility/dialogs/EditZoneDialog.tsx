import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateZone } from '@/hooks/admin/useZones';
import { toast } from 'sonner';

interface EditZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditZoneDialog({ open, onOpenChange, facilityId, elementData }: EditZoneDialogProps) {
  const updateZone = useUpdateZone();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone_type: 'general' as 'general' | 'restricted' | 'staging' | 'storage' | 'work',
    grid_position_x: 10,
    grid_position_y: 10,
    grid_width: 20,
    grid_height: 15,
    color: '#8b5cf6',
  });

  useEffect(() => {
    if (elementData) {
      setFormData({
        name: elementData.name || '',
        description: elementData.description || '',
        zone_type: elementData.zone_type || 'general',
        grid_position_x: elementData.grid_position_x || 10,
        grid_position_y: elementData.grid_position_y || 10,
        grid_width: elementData.grid_width || 20,
        grid_height: elementData.grid_height || 15,
        color: elementData.color || '#8b5cf6',
      });
    }
  }, [elementData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateZone.mutateAsync({
      id: elementData.id,
      ...formData,
    });

    toast.success(`Zone "${formData.name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Zone</DialogTitle>
          <DialogDescription>
            Update the zone properties
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
              placeholder="e.g., Loading Zone, Waiting Area"
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
          <div className="space-y-2">
            <Label htmlFor="zone_type">Zone Type</Label>
            <Select value={formData.zone_type} onValueChange={(v: any) => setFormData({ ...formData, zone_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="work">Work</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-10"
              />
              <span className="text-sm text-muted-foreground">Zone color</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
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
              <Label htmlFor="height">Height</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Update Zone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
