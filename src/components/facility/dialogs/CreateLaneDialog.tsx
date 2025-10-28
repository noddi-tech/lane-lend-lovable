import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLane } from "@/hooks/admin/useLanes";

interface CreateLaneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
}

export function CreateLaneDialog({ open, onOpenChange, facilityId }: CreateLaneDialogProps) {
  const [name, setName] = useState("");
  const [gridY, setGridY] = useState(5);
  const [gridHeight, setGridHeight] = useState(2);

  const createLane = useCreateLane();

  const handleSubmit = async () => {
    if (!name) return;
    
    await createLane.mutateAsync({
      facility_id: facilityId,
      name,
      position_order: 1,
      grid_position_y: gridY,
      grid_height: gridHeight,
    } as any);
    onOpenChange(false);
    setName("");
    setGridY(5);
    setGridHeight(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Lane</DialogTitle>
          <DialogDescription>
            Add a new lane to this facility. Lanes span the full width of the facility.
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label htmlFor="lane-height">Height (cells)</Label>
              <Input
                id="lane-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={3}
                max={15}
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
