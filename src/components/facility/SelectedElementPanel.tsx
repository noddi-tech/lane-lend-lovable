import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUpdateDrivingGate, useDeleteDrivingGate } from "@/hooks/admin/useDrivingGates";
import { useUpdateLane, useDeleteLane } from "@/hooks/admin/useLanes";
import { useUpdateStation, useDeleteStation } from "@/hooks/admin/useStations";
import { toast } from "sonner";

interface SelectedElementPanelProps {
  element: {
    type: string;
    id: string;
    data: any;
  } | null;
  onClose: () => void;
}

export function SelectedElementPanel({ element, onClose }: SelectedElementPanelProps) {
  const [name, setName] = useState("");
  const [gridX, setGridX] = useState(0);
  const [gridY, setGridY] = useState(0);
  const [gridWidth, setGridWidth] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);

  const updateGate = useUpdateDrivingGate();
  const deleteGate = useDeleteDrivingGate();
  const updateLane = useUpdateLane();
  const deleteLane = useDeleteLane();
  const updateStation = useUpdateStation();
  const deleteStation = useDeleteStation();

  useEffect(() => {
    if (element?.data) {
      setName(element.data.name || "");
      setGridX(element.data.grid_x || 0);
      setGridY(element.data.grid_y || 0);
      setGridWidth(element.data.grid_width || 0);
      setGridHeight(element.data.grid_height || 0);
    }
  }, [element]);

  if (!element) return null;

  const handleUpdate = async () => {
    try {
      const updates = { name, grid_x: gridX, grid_y: gridY, grid_width: gridWidth, grid_height: gridHeight };
      
      if (element.type === "gate") {
        await updateGate.mutateAsync({ id: element.id, ...updates } as any);
      } else if (element.type === "lane") {
        await updateLane.mutateAsync({ id: element.id, ...updates } as any);
      } else if (element.type === "station") {
        await updateStation.mutateAsync({ id: element.id, ...updates } as any);
      }
      
      toast.success("Updated successfully");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this ${element.type}?`)) return;
    
    try {
      if (element.type === "gate") {
        await deleteGate.mutateAsync(element.id);
      } else if (element.type === "lane") {
        await deleteLane.mutateAsync(element.id);
      } else if (element.type === "station") {
        await deleteStation.mutateAsync(element.id);
      }
      
      onClose();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <Card className="w-80">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base capitalize">{element.type} Properties</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="element-name">Name</Label>
          <Input
            id="element-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="element-x" className="text-xs">Grid X</Label>
            <Input
              id="element-x"
              type="number"
              value={gridX}
              onChange={(e) => setGridX(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="element-y" className="text-xs">Grid Y</Label>
            <Input
              id="element-y"
              type="number"
              value={gridY}
              onChange={(e) => setGridY(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="element-width" className="text-xs">Width</Label>
            <Input
              id="element-width"
              type="number"
              value={gridWidth}
              onChange={(e) => setGridWidth(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="element-height" className="text-xs">Height</Label>
            <Input
              id="element-height"
              type="number"
              value={gridHeight}
              onChange={(e) => setGridHeight(Number(e.target.value))}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleUpdate} size="sm" className="flex-1">
            Save Changes
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
