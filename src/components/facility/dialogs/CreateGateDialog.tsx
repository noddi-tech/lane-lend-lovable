import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDrivingGate } from "@/hooks/admin/useDrivingGates";

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

  const createGate = useCreateDrivingGate();

  const handleSubmit = async () => {
    await createGate.mutateAsync({
      facility_id: facilityId,
      name,
      time_zone: "UTC",
      operational_start_time: "08:00",
      operational_end_time: "18:00",
    } as any);
    onOpenChange(false);
    setName("");
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
