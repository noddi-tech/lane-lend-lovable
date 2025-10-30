import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateStorageLocation } from '@/hooks/admin/useStorageLocations';
import { useRooms } from '@/hooks/admin/useRooms';
import { useZones } from '@/hooks/admin/useZones';
import { useOutsideAreas } from '@/hooks/admin/useOutsideAreas';
import { useLanes } from '@/hooks/admin/useLanes';
import { useState, useEffect } from 'react';

interface CreateStorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: Array<{ id: string; name: string }>;
  facilityId: string;
}

export function CreateStorageLocationDialog({ open, onOpenChange, lanes, facilityId }: CreateStorageLocationDialogProps) {
  const createStorageLocation = useCreateStorageLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [storageType, setStorageType] = useState<'general' | 'parts' | 'tools' | 'hazmat' | 'other'>('general');
  const [parentType, setParentType] = useState<'lane' | 'room' | 'zone' | 'outside'>('lane');
  const [parentId, setParentId] = useState<string>("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(0);

  const { data: rooms } = useRooms(facilityId);
  const { data: zones } = useZones(facilityId);
  const { data: outsideAreas } = useOutsideAreas(facilityId);
  const { data: allLanes } = useLanes();
  const facilityLanes = allLanes?.filter(l => l.facility_id === facilityId) || [];

  const availableParents = parentType === 'lane' ? facilityLanes :
                           parentType === 'room' ? (rooms || []) :
                           parentType === 'zone' ? (zones || []) :
                           parentType === 'outside' ? (outsideAreas || []) : [];

  // Auto-calculate position when parent is selected
  useEffect(() => {
    if (!parentId || availableParents.length === 0) return;
    
    const parent = availableParents.find((p: any) => p.id === parentId);
    if (!parent) return;
    
    // Calculate center of parent
    const parentX = parent.grid_position_x || 0;
    const parentY = parent.grid_position_y || 0;
    const parentWidth = parent.grid_width || 10;
    const parentHeight = parent.grid_height || 10;
    
    // Position in center of parent (1x1 storage)
    const centerX = parentX + Math.floor((parentWidth - 1) / 2);
    const centerY = parentY + Math.floor((parentHeight - 1) / 2);
    
    setGridX(Math.max(parentX, centerX));
    setGridY(Math.max(parentY, centerY));
  }, [parentId, availableParents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createStorageLocation.mutateAsync({
      lane_id: parentType === 'lane' ? parentId : null,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
      name,
      description: description || null,
      storage_type: storageType,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: 1,
      grid_height: 1,
      status: 'available',
    } as any);

    setName('');
    setDescription('');
    setStorageType('general');
    setParentType('lane');
    setParentId("");
    setGridX(0);
    setGridY(0);
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
            <Label>Place Inside</Label>
            <Select value={parentType} onValueChange={(v: any) => {
              setParentType(v);
              setParentId("");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lane">🛣️ On a Lane</SelectItem>
                <SelectItem value="room">🏠 Inside a Room</SelectItem>
                <SelectItem value="zone">📍 Inside a Zone</SelectItem>
                <SelectItem value="outside">🌳 Inside an Outside Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {availableParents.length > 0 && (
            <div>
              <Label>Select {parentType === 'lane' ? 'Lane' : parentType === 'room' ? 'Room' : parentType === 'zone' ? 'Zone' : 'Outside Area'}</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${parentType}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableParents.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
