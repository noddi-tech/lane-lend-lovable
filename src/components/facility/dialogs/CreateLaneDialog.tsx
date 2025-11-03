import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLane } from "@/hooks/admin/useLanes";
import { useRooms } from "@/hooks/admin/useRooms";
import { useZones } from "@/hooks/admin/useZones";
import { useOutsideAreas } from "@/hooks/admin/useOutsideAreas";

interface CreateLaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
}

export function CreateLaneDialog({ open, onOpenChange, facilityId }: CreateLaneDialogProps) {
  const [name, setName] = useState("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(5);
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(2);
  const [parentType, setParentType] = useState<'room' | 'zone' | 'outside' | 'none'>('none');
  const [parentId, setParentId] = useState<string>("");

  const createLane = useCreateLane();
  const { data: rooms } = useRooms(facilityId);
  const { data: zones } = useZones(facilityId);
  const { data: outsideAreas } = useOutsideAreas(facilityId);

  // Auto-calculate position when parent changes
  useEffect(() => {
    if (parentType === 'none' || !parentId) return;

    const parent = parentType === 'room' ? rooms?.find(r => r.id === parentId) :
                   parentType === 'zone' ? zones?.find(z => z.id === parentId) :
                   parentType === 'outside' ? outsideAreas?.find(a => a.id === parentId) : null;

    if (parent) {
      const parentX = (parent as any).grid_position_x || (parent as any).grid_x || 0;
      const parentY = (parent as any).grid_position_y || (parent as any).grid_y || 0;
      const parentWidth = (parent as any).grid_width || 20;
      const parentHeight = (parent as any).grid_height || 20;

      // Position lane at center of parent container
      setGridX(parentX);
      setGridY(parentY + Math.floor(parentHeight / 2) - Math.floor(gridHeight / 2));
      setGridWidth(parentWidth); // Match parent width
    }
  }, [parentId, parentType, rooms, zones, outsideAreas, gridHeight]);

  const availableParents = parentType === 'room' ? (rooms || []) :
                           parentType === 'zone' ? (zones || []) :
                           parentType === 'outside' ? (outsideAreas || []) : [];

  const handleSubmit = async () => {
    if (!name) return;
    
    await createLane.mutateAsync({
      facility_id: facilityId,
      name,
      position_order: 1,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
    } as any);
    onOpenChange(false);
    setName("");
    setGridX(0);
    setGridY(5);
    setGridWidth(20);
    setGridHeight(2);
    setParentType('none');
    setParentId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Lane</DialogTitle>
          <DialogDescription>
            Add a new lane to this facility. You can customize its position and width.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lane-name">Lane Name</Label>
            <Input
              id="lane-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Express Lane"
            />
          </div>
          <div>
            <Label>Place Inside (Optional)</Label>
            <Select value={parentType} onValueChange={(v: any) => {
              setParentType(v);
              setParentId("");
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Directly in Facility</SelectItem>
                <SelectItem value="room">🏠 Inside a Room</SelectItem>
                <SelectItem value="zone">📍 Inside a Zone</SelectItem>
                <SelectItem value="outside">🌳 Inside an Outside Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {parentType !== 'none' && availableParents.length > 0 && (
            <div>
              <Label>Select {parentType === 'room' ? 'Room' : parentType === 'zone' ? 'Zone' : 'Outside Area'}</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lane-x">Grid X Position</Label>
              <Input
                id="lane-x"
                type="number"
                value={gridX}
                onChange={(e) => setGridX(Number(e.target.value))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="lane-y">Grid Y Position</Label>
              <Input
                id="lane-y"
                type="number"
                value={gridY}
                onChange={(e) => setGridY(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lane-width">Width (cells)</Label>
              <Input
                id="lane-width"
                type="number"
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                min={10}
                max={100}
              />
            </div>
            <div>
              <Label htmlFor="lane-height">Height (cells)</Label>
              <Input
                id="lane-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={2}
                max={100}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name}>
            Create Lane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
