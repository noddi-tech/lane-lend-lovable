import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateZone } from '@/hooks/admin/useZones';

interface CreateZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId?: string;
  roomId?: string;
}

export function CreateZoneDialog({ open, onOpenChange, facilityId, roomId }: CreateZoneDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [zoneType, setZoneType] = useState<'general' | 'storage' | 'work' | 'staging' | 'restricted'>('general');
  const [color, setColor] = useState('#8b5cf6');
  const [gridWidth, setGridWidth] = useState(10);
  const [gridHeight, setGridHeight] = useState(10);

  const createZone = useCreateZone();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createZone.mutateAsync({
      name,
      description: description || null,
      zone_type: zoneType,
      color,
      facility_id: facilityId || null,
      room_id: roomId || null,
      grid_position_x: 0,
      grid_position_y: 0,
      grid_width: gridWidth,
      grid_height: gridHeight,
    });

    setName('');
    setDescription('');
    setZoneType('general');
    setColor('#8b5cf6');
    setGridWidth(10);
    setGridHeight(10);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Zone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Storage Area A"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="zone-type">Zone Type</Label>
            <Select value={zoneType} onValueChange={(value: any) => setZoneType(value)}>
              <SelectTrigger id="zone-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="work">Work Area</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#8b5cf6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grid-width">Grid Width</Label>
              <Input
                id="grid-width"
                type="number"
                min="1"
                value={gridWidth}
                onChange={(e) => setGridWidth(parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="grid-height">Grid Height</Label>
              <Input
                id="grid-height"
                type="number"
                min="1"
                value={gridHeight}
                onChange={(e) => setGridHeight(parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Zone</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
