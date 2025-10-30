import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateOutsideArea } from '@/hooks/admin/useOutsideAreas';
import { toast } from 'sonner';

interface EditOutsideAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditOutsideAreaDialog({ open, onOpenChange, facilityId, elementData }: EditOutsideAreaDialogProps) {
  const updateOutsideArea = useUpdateOutsideArea();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    area_type: 'other' as 'container_storage' | 'grass' | 'loading_zone' | 'other' | 'parking',
    grid_position_x: 10,
    grid_position_y: 10,
    grid_width: 20,
    grid_height: 15,
    color: '#6b7280',
  });

  useEffect(() => {
    if (elementData) {
      setFormData({
        name: elementData.name || '',
        description: elementData.description || '',
        area_type: elementData.area_type || 'other',
        grid_position_x: elementData.grid_position_x || 10,
        grid_position_y: elementData.grid_position_y || 10,
        grid_width: elementData.grid_width || 20,
        grid_height: elementData.grid_height || 15,
        color: elementData.color || '#6b7280',
      });
    }
  }, [elementData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateOutsideArea.mutateAsync({
      id: elementData.id,
      ...formData,
    });

    toast.success(`Outside area "${formData.name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Outside Area</DialogTitle>
          <DialogDescription>
            Update the outside area properties
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
              placeholder="e.g., Parking Lot, Loading Dock"
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
            <Label htmlFor="area_type">Area Type</Label>
            <Select value={formData.area_type} onValueChange={(v: any) => setFormData({ ...formData, area_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="loading_zone">Loading Zone</SelectItem>
                <SelectItem value="container_storage">Container Storage</SelectItem>
                <SelectItem value="grass">Grass</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
              <span className="text-sm text-muted-foreground">Area color</span>
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
              Update Outside Area
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
