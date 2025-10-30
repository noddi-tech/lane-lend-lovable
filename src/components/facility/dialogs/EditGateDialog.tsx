import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateDrivingGate } from "@/hooks/admin/useDrivingGates";
import { toast } from "sonner";

interface EditGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditGateDialog({ open, onOpenChange, facilityId, elementData }: EditGateDialogProps) {
  const [name, setName] = useState("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(3);
  const [gridHeight, setGridHeight] = useState(10);

  const updateGate = useUpdateDrivingGate();

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setGridX(elementData.grid_position_x || 0);
      setGridY(elementData.grid_position_y || 10);
      setGridWidth(elementData.grid_width || 3);
      setGridHeight(elementData.grid_height || 10);
    }
  }, [elementData]);

  const handleSubmit = async () => {
    await updateGate.mutateAsync({
      id: elementData.id,
      name,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    });
    toast.success(`Gate "${name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Driving Gate</DialogTitle>
          <DialogDescription>
            Update the gate properties
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
                max={100}
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
            Update Gate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
