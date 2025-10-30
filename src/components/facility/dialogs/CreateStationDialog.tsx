import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStation } from "@/hooks/admin/useStations";
import { useRooms } from "@/hooks/admin/useRooms";
import { useZones } from "@/hooks/admin/useZones";
import { useOutsideAreas } from "@/hooks/admin/useOutsideAreas";
import { useLanes } from "@/hooks/admin/useLanes";

interface CreateStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: Array<{ id: string; name: string }>;
  facilityId: string;
}

export function CreateStationDialog({ open, onOpenChange, lanes, facilityId }: CreateStationDialogProps) {
  const [name, setName] = useState("");
  const [parentType, setParentType] = useState<'lane' | 'room' | 'zone' | 'outside'>('lane');
  const [parentId, setParentId] = useState<string>("");
  const [gridX, setGridX] = useState(10);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(4);
  const [gridHeight, setGridHeight] = useState(3);

  const createStation = useCreateStation();
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
    
    // Position in center of parent
    const centerX = parentX + Math.floor((parentWidth - gridWidth) / 2);
    const centerY = parentY + Math.floor((parentHeight - gridHeight) / 2);
    
    setGridX(Math.max(parentX, centerX));
    setGridY(Math.max(parentY, centerY));
  }, [parentId, availableParents, gridWidth, gridHeight]);

  const handleSubmit = async () => {
    if (!parentId) return;
    
    await createStation.mutateAsync({
      lane_id: parentType === 'lane' ? parentId : null,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
      name,
      station_type: "service",
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    } as any);
    onOpenChange(false);
    setName("");
    setParentType('lane');
    setParentId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Station</DialogTitle>
          <DialogDescription>
            Add a new work station to a lane
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="station-name">Station Name</Label>
            <Input
              id="station-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Oil Change Bay"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="station-x">Grid X</Label>
              <Input
                id="station-x"
                type="number"
                value={gridX}
                onChange={(e) => setGridX(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="station-y">Grid Y</Label>
              <Input
                id="station-y"
                type="number"
                value={gridY}
                onChange={(e) => setGridY(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="station-width">Width (cells)</Label>
              <Input
                id="station-width"
                type="number"
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                min={2}
                max={10}
              />
            </div>
            <div>
              <Label htmlFor="station-height">Height (cells)</Label>
              <Input
                id="station-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={2}
                max={8}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !parentId}>
            Create Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
