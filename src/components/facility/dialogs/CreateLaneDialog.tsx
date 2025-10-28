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
  drivingGates: Array<{ id: string; name: string }>;
}

export function CreateLaneDialog({ open, onOpenChange, drivingGates }: CreateLaneDialogProps) {
  const [name, setName] = useState("");
  const [drivingGateId, setDrivingGateId] = useState("");
  const [gridY, setGridY] = useState(5);
  const [gridHeight, setGridHeight] = useState(5);

  const createLane = useCreateLane();

  const handleSubmit = async () => {
    if (!drivingGateId) return;
    
    await createLane.mutateAsync({
      driving_gate_id: drivingGateId,
      name,
      position_order: 1,
      grid_position_y: gridY,
      grid_height: gridHeight,
    } as any);
    onOpenChange(false);
    setName("");
    setDrivingGateId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Lane</DialogTitle>
          <DialogDescription>
            Add a new lane to a driving gate
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
          <div>
            <Label htmlFor="driving-gate">Driving Gate</Label>
            <Select value={drivingGateId} onValueChange={setDrivingGateId}>
              <SelectTrigger id="driving-gate">
                <SelectValue placeholder="Select a gate" />
              </SelectTrigger>
              <SelectContent>
                {drivingGates.map((gate) => (
                  <SelectItem key={gate.id} value={gate.id}>
                    {gate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={!name || !drivingGateId}>
            Create Lane
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
