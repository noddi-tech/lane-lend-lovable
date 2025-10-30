import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateStation } from "@/hooks/admin/useStations";
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

  const updateStation = useUpdateStation();

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setGridX(elementData.grid_position_x || 10);
      setGridY(elementData.grid_position_y || 10);
      setGridWidth(elementData.grid_width || 4);
      setGridHeight(elementData.grid_height || 3);
    }
  }, [elementData]);

  const handleSubmit = async () => {
    await updateStation.mutateAsync({
      id: elementData.id,
      name,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    });
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
          <Button onClick={handleSubmit} disabled={!name}>
            Update Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
