import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateStorageLocation } from "@/hooks/admin/useStorageLocations";
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

  const updateStorage = useUpdateStorageLocation();

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setStorageType(elementData.storage_type || "general");
      setStatus(elementData.status || "available");
      setGridX(elementData.grid_position_x || 10);
      setGridY(elementData.grid_position_y || 10);
      setGridWidth(elementData.grid_width || 2);
      setGridHeight(elementData.grid_height || 2);
    }
  }, [elementData]);

  const handleSubmit = async () => {
    await updateStorage.mutateAsync({
      id: elementData.id,
      name,
      storage_type: storageType,
      status,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    });
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
                max={5}
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
                max={5}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name}>
            Update Storage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
