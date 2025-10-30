import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateStorageLocation } from "@/hooks/admin/useStorageLocations";
import { useRooms } from "@/hooks/admin/useRooms";
import { useZones } from "@/hooks/admin/useZones";
import { useLanes } from "@/hooks/admin/useLanes";
import { toast } from "sonner";

interface EditStorageLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditStorageLocationDialog({ open, onOpenChange, facilityId, elementData }: EditStorageLocationDialogProps) {
  const [name, setName] = useState("");
  const [storageType, setStorageType] = useState<'general' | 'hazmat' | 'other' | 'parts' | 'tools'>("general");
  const [status, setStatus] = useState<'available' | 'maintenance' | 'occupied' | 'reserved'>("available");
  const [gridX, setGridX] = useState(10);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(2);
  const [gridHeight, setGridHeight] = useState(2);
  const [parentType, setParentType] = useState<'lane' | 'room' | 'zone' | null>(null);
  const [parentId, setParentId] = useState<string>("");

  const updateStorage = useUpdateStorageLocation();
  const { data: rooms } = useRooms(facilityId);
  const { data: zones } = useZones(facilityId);
  const { data: allLanes } = useLanes();
  const facilityLanes = allLanes?.filter(l => (l as any).facility_id === facilityId) || [];
  
  const availableParents = parentType === 'lane' ? facilityLanes :
                           parentType === 'room' ? (rooms || []) :
                           parentType === 'zone' ? (zones || []) : [];

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setStorageType(elementData.storage_type || "general");
      setStatus(elementData.status || "available");
      setGridX(elementData.grid_position_x || 10);
      setGridY(elementData.grid_position_y || 10);
      setGridWidth(elementData.grid_width || 2);
      setGridHeight(elementData.grid_height || 2);
      
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
      }
    }
  }, [elementData]);

  const handleSubmit = async () => {
    if (!parentId || !parentType) return;
    
    await updateStorage.mutateAsync({
      id: elementData.id,
      name,
      storage_type: storageType,
      status,
      lane_id: parentType === 'lane' ? parentId : null,
      room_id: parentType === 'room' ? parentId : null,
      zone_id: parentType === 'zone' ? parentId : null,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    } as any);
    toast.success(`Storage "${name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Storage Location</DialogTitle>
          <DialogDescription>
            Update the storage location properties
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="storage-name">Storage Name</Label>
            <Input
              id="storage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Parts Shelf A"
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
              </SelectContent>
            </Select>
          </div>
          {parentType && availableParents.length > 0 && (
            <div>
              <Label>Select {parentType === 'lane' ? 'Lane' : parentType === 'room' ? 'Room' : 'Zone'}</Label>
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
              <Label htmlFor="storage-type">Storage Type</Label>
              <Select value={storageType} onValueChange={(v: any) => setStorageType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="parts">Parts</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="hazmat">Hazmat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="storage-status">Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage-x">Grid X</Label>
              <Input
                id="storage-x"
                type="number"
                value={gridX}
                onChange={(e) => setGridX(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="storage-y">Grid Y</Label>
              <Input
                id="storage-y"
                type="number"
                value={gridY}
                onChange={(e) => setGridY(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage-width">Width (cells)</Label>
              <Input
                id="storage-width"
                type="number"
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>
            <div>
              <Label htmlFor="storage-height">Height (cells)</Label>
              <Input
                id="storage-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={1}
                max={50}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name || !parentId || !parentType}>
            Update Storage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
