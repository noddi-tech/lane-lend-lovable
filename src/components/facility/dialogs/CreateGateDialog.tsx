import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDrivingGate } from "@/hooks/admin/useDrivingGates";
import { useRooms } from "@/hooks/admin/useRooms";
import { useZones } from "@/hooks/admin/useZones";
import { useOutsideAreas } from "@/hooks/admin/useOutsideAreas";

interface CreateGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
}

export function CreateGateDialog({ open, onOpenChange, facilityId }: CreateGateDialogProps) {
  const [name, setName] = useState("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(3);
  const [gridHeight, setGridHeight] = useState(10);
  const [parentType, setParentType] = useState<'room' | 'zone' | 'outside' | 'none'>('none');
  const [parentId, setParentId] = useState<string>("");

  const createGate = useCreateDrivingGate();
  const { data: rooms } = useRooms(facilityId);
  const { data: zones } = useZones(facilityId);
  const { data: outsideAreas } = useOutsideAreas(facilityId);

  const availableParents = parentType === 'room' ? (rooms || []) :
                           parentType === 'zone' ? (zones || []) :
                           parentType === 'outside' ? (outsideAreas || []) : [];

  const handleSubmit = async () => {
    await createGate.mutateAsync({
      facility_id: facilityId,
      name,
      open_time: "08:00:00",
      close_time: "17:00:00",
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
    } as any);
    onOpenChange(false);
    setName("");
    setParentType('none');
    setParentId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Driving Gate</DialogTitle>
          <DialogDescription>
            Add a new entrance gate to the facility
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="gate-name">Gate Name</Label>
            <Input
              id="gate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Entrance"
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
              <Label htmlFor="gate-x">Grid X</Label>
              <Input
                id="gate-x"
                type="number"
                value={gridX}
                onChange={(e) => setGridX(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="gate-y">Grid Y</Label>
              <Input
                id="gate-y"
                type="number"
                value={gridY}
                onChange={(e) => setGridY(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gate-width">Width (cells)</Label>
              <Input
                id="gate-width"
                type="number"
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                min={2}
                max={5}
              />
            </div>
            <div>
              <Label htmlFor="gate-height">Height (cells)</Label>
              <Input
                id="gate-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={5}
                max={20}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name}>
            Create Gate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
