import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateRoom } from '@/hooks/admin/useRooms';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
}

export function CreateRoomDialog({ open, onOpenChange, facilityId }: CreateRoomDialogProps) {
  const createRoom = useCreateRoom();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    grid_position_x: 10,
    grid_position_y: 10,
    grid_width: 30,
    grid_height: 20,
    color: '#3b82f6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createRoom.mutateAsync({
      ...formData,
      facility_id: facilityId,
    });

    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      grid_position_x: 10,
      grid_position_y: 10,
      grid_width: 30,
      grid_height: 20,
      color: '#3b82f6',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Create a room to organize areas within this facility. Rooms can contain gates, lanes, and stations.
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
              placeholder="e.g., Workshop Area, Inspection Zone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              placeholder="Optional description of this room"
            />
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
              <span className="text-sm text-muted-foreground">
                Choose a color to distinguish this room
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (grid units)</Label>
              <Input
                id="width"
                type="number"
                min="5"
                max="500"
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
                min="5"
                max="500"
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
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
