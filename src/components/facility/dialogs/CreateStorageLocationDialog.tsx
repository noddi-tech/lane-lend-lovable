import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateStorageLocation } from '@/hooks/admin/useStorageLocations';
import { useState } from 'react';

interface CreateStorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  laneId?: string;
  roomId?: string;
}

export function CreateStorageLocationDialog({ open, onOpenChange, laneId, roomId }: CreateStorageLocationDialogProps) {
  const createStorageLocation = useCreateStorageLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [storageType, setStorageType] = useState<'general' | 'parts' | 'tools' | 'hazmat' | 'other'>('general');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createStorageLocation.mutateAsync({
      lane_id: laneId || null,
      room_id: roomId || null,
      name,
      description: description || null,
      storage_type: storageType,
      grid_position_x: 0,
      grid_position_y: 0,
      grid_width: 1,
      grid_height: 1,
      status: 'available',
    });

    setName('');
    setDescription('');
    setStorageType('general');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Storage Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., A1, B-23"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="storage-type">Storage Type</Label>
            <Select value={storageType} onValueChange={(value: any) => setStorageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Storage</SelectItem>
                <SelectItem value="parts">Parts Storage</SelectItem>
                <SelectItem value="tools">Tools Storage</SelectItem>
                <SelectItem value="hazmat">Hazmat Storage</SelectItem>
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
            <Button type="submit" disabled={createStorageLocation.isPending}>
              {createStorageLocation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
