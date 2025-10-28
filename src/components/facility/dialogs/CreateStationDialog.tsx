import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStation } from "@/hooks/admin/useStations";

interface CreateStationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lanes: Array<{ id: string; name: string }>;
}

export function CreateStationDialog({ open, onOpenChange, lanes }: CreateStationDialogProps) {
  const [name, setName] = useState("");
  const [laneId, setLaneId] = useState("");
  const [gridX, setGridX] = useState(10);
  const [gridY, setGridY] = useState(10);
  const [gridWidth, setGridWidth] = useState(4);
  const [gridHeight, setGridHeight] = useState(3);

  const createStation = useCreateStation();

  const handleSubmit = async () => {
    if (!laneId) return;
    
    await createStation.mutateAsync({
      lane_id: laneId,
      name,
      station_type: "service",
    } as any);
    onOpenChange(false);
    setName("");
    setLaneId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Station</DialogTitle>
          <DialogDescription>
            Add a new work station to a lane
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
            <Label htmlFor="lane">Lane</Label>
            <Select value={laneId} onValueChange={setLaneId}>
              <SelectTrigger id="lane">
                <SelectValue placeholder="Select a lane" />
              </SelectTrigger>
              <SelectContent>
                {lanes.map((lane) => (
                  <SelectItem key={lane.id} value={lane.id}>
                    {lane.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={!name || !laneId}>
            Create Station
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
