import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOutsideArea } from '@/hooks/admin/useOutsideAreas';
import { useState } from 'react';

interface CreateOutsideAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
}

export function CreateOutsideAreaDialog({ open, onOpenChange, facilityId }: CreateOutsideAreaDialogProps) {
  const createOutsideArea = useCreateOutsideArea();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [areaType, setAreaType] = useState<'parking' | 'grass' | 'container_storage' | 'loading_zone' | 'other'>('parking');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createOutsideArea.mutateAsync({
      facility_id: facilityId,
      name,
      description: description || null,
      area_type: areaType,
      grid_position_x: 0,
      grid_position_y: 0,
      grid_width: 20,
      grid_height: 20,
      color: '#6b7280',
    });

    setName('');
    setDescription('');
    setAreaType('parking');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Outside Area</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Parking Lot"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="area-type">Area Type</Label>
            <Select value={areaType} onValueChange={(value: any) => setAreaType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parking">Parking Lot</SelectItem>
                <SelectItem value="grass">Landscaping/Grass</SelectItem>
                <SelectItem value="container_storage">Container Storage</SelectItem>
                <SelectItem value="loading_zone">Loading Zone</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOutsideArea.isPending}>
              {createOutsideArea.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
