import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateLane } from "@/hooks/admin/useLanes";
import { toast } from "sonner";

interface EditLaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  elementData: any;
}

export function EditLaneDialog({ open, onOpenChange, facilityId, elementData }: EditLaneDialogProps) {
  const [name, setName] = useState("");
  const [gridY, setGridY] = useState(0);
  const [gridHeight, setGridHeight] = useState(2);

  const updateLane = useUpdateLane();

  useEffect(() => {
    if (elementData) {
      setName(elementData.name || "");
      setGridY(elementData.grid_position_y || 0);
      setGridHeight(elementData.grid_height || 2);
    }
  }, [elementData]);

  const handleSubmit = async () => {
    await updateLane.mutateAsync({
      id: elementData.id,
      name,
      grid_position_y: gridY,
      grid_height: gridHeight,
    });
    toast.success(`Lane "${name}" updated successfully`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Lane</DialogTitle>
          <DialogDescription>
            Update the lane properties
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="lane-name">Lane Name</Label>
            <Input
              id="lane-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Service Lane 1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lane-y">Grid Y Position</Label>
              <Input
                id="lane-y"
                type="number"
                value={gridY}
                onChange={(e) => setGridY(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="lane-height">Height (cells)</Label>
              <Input
                id="lane-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={1}
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
            Update Lane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
