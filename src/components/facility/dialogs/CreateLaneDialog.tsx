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
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(5);
  const [gridWidth, setGridWidth] = useState(50);
  const [gridHeight, setGridHeight] = useState(2);

  const createLane = useCreateLane();

  const handleSubmit = async () => {
    if (!name) return;
    
    await createLane.mutateAsync({
      facility_id: facilityId,
      name,
      position_order: 1,
      grid_position_x: gridX,
      grid_position_y: gridY,
      grid_width: gridWidth,
      grid_height: gridHeight,
    } as any);
    onOpenChange(false);
    setName("");
    setGridX(0);
    setGridY(5);
    setGridWidth(50);
    setGridHeight(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Lane</DialogTitle>
          <DialogDescription>
            Add a new lane to this facility. You can customize its position and width.
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
              <Label htmlFor="lane-x">Grid X Position</Label>
              <Input
                id="lane-x"
                type="number"
                value={gridX}
                onChange={(e) => setGridX(Number(e.target.value))}
                min={0}
              />
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lane-width">Width (cells)</Label>
              <Input
                id="lane-width"
                type="number"
                value={gridWidth}
                onChange={(e) => setGridWidth(Number(e.target.value))}
                min={10}
                max={100}
              />
            </div>
            <div>
              <Label htmlFor="lane-height">Height (cells)</Label>
              <Input
                id="lane-height"
                type="number"
                value={gridHeight}
                onChange={(e) => setGridHeight(Number(e.target.value))}
                min={2}
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
