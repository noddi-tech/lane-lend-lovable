import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateStation } from "@/hooks/admin/useStations";
import { useRooms } from "@/hooks/admin/useRooms";
import { useZones } from "@/hooks/admin/useZones";
import { useOutsideAreas } from "@/hooks/admin/useOutsideAreas";
import { useLanes } from "@/hooks/admin/useLanes";
import { toast } from "sonner";

interface EditStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditStationDialog({ open, onOpenChange, facilityId, elementData }: EditStationDialogProps) {
  const [name, setName] = useState("");
  const [gridX, setGridX] = useState(10);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(4);
  const [gridHeight, setGridHeight] = useState(3);
  const [parentType, setParentType] = useState<'lane' | 'room' | 'zone' | 'outside' | null>(null);
  const [parentId, setParentId] = useState<string>("");

  const updateStation = useUpdateStation();
  const { data: rooms } = useRooms(facilityId);
  const { data: zones } = useZones(facilityId);
  const { data: outsideAreas } = useOutsideAreas(facilityId);
  const { data: allLanes } = useLanes();
  const facilityLanes = allLanes?.filter(l => (l as any).facility_id === facilityId) || [];
  
  const availableParents = parentType === 'lane' ? facilityLanes :
                           parentType === 'room' ? (rooms || []) :
                           parentType === 'zone' ? (zones || []) :
                           parentType === 'outside' ? (outsideAreas || []) : [];

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setGridX(elementData.grid_position_x || 10);
      setGridY(elementData.grid_position_y || 10);
      setGridWidth(elementData.grid_width || 4);
      setGridHeight(elementData.grid_height || 3);
      
      // Determine current parent type and ID
      if (elementData.lane_id) {
        setParentType('lane');
        setParentId(elementData.lane_id);
      } else if (elementData.room_id) {
        setParentType('room');
        setParentId(elementData.room_id);
      } else if (elementData.zone_id) {
        setParentType('zone');
        setParentId(elementData.zone_id);
      } else if ((elementData as any).outside_area_id) {
        setParentType('outside');
        setParentId((elementData as any).outside_area_id);
      }
    }
  }, [elementData]);

  const handleSubmit = async () => {
    if (!parentId || !parentType) return;
    
    await updateStation.mutateAsync({
      id: elementData.id,
      name,
      lane_id: parentType === 'lane' ? parentId : null,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    } as any);
    toast.success(`Station "${name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Station</DialogTitle>
          <DialogDescription>
            Update the station properties
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
            <Select value={parentType || ''} onValueChange={(v: any) => {
              setParentType(v);
              setParentId("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lane">🛣️ On a Lane</SelectItem>
                <SelectItem value="room">🏠 Inside a Room</SelectItem>
                <SelectItem value="zone">📍 Inside a Zone</SelectItem>
                <SelectItem value="outside">🌳 Inside an Outside Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {parentType && availableParents.length > 0 && (
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
          <Button onClick={handleSubmit} disabled={!name || !parentId || !parentType}>
            Update Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
