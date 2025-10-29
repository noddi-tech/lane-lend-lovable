import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Trash2 } from 'lucide-react';
import { LayoutBlock } from './BlockGridBuilder';
import { useUpdateDrivingGate, useDeleteDrivingGate } from '@/hooks/admin/useDrivingGates';
import { useUpdateLane, useDeleteLane } from '@/hooks/admin/useLanes';
import { useUpdateStation, useDeleteStation } from '@/hooks/admin/useStations';
import { toast } from 'sonner';

interface BlockPropertiesProps {
  block: LayoutBlock | null;
  onClose: () => void;
}

export function BlockProperties({ block, onClose }: BlockPropertiesProps) {
  const [name, setName] = useState('');
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
    if (block) {
      setName(block.name);
      setGridX(block.grid_x);
      setGridY(block.grid_y);
      setGridWidth(block.grid_width);
      setGridHeight(block.grid_height);
    }
  }, [block]);

  if (!block) return null;

  const handleSave = async () => {
    try {
      if (block.type === 'gate') {
        await updateGate.mutateAsync({
          id: block.id,
          name,
          grid_position_x: gridX,
          grid_position_y: gridY,
          grid_width: gridWidth,
          grid_height: gridHeight,
        } as any);
      } else if (block.type === 'lane') {
      await updateLane.mutateAsync({
        id: block.id,
        name,
        grid_position_x: gridX,
        grid_position_y: gridY,
        grid_width: gridWidth,
        grid_height: gridHeight,
      } as any);
      } else if (block.type === 'station') {
        await updateStation.mutateAsync({
          id: block.id,
          name,
          grid_position_x: gridX,
          grid_position_y: gridY,
          grid_width: gridWidth,
          grid_height: gridHeight,
        } as any);
      }
      toast.success('Block updated');
    } catch (error) {
      toast.error('Failed to update block');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${block.name}?`)) return;

    try {
      if (block.type === 'gate') {
        await deleteGate.mutateAsync(block.id);
      } else if (block.type === 'lane') {
        await deleteLane.mutateAsync(block.id);
      } else if (block.type === 'station') {
        await deleteStation.mutateAsync(block.id);
      }
      toast.success('Block deleted');
      onClose();
    } catch (error) {
      toast.error('Failed to delete block');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">
          {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Properties
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="block-name">Name</Label>
          <Input
            id="block-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="block-x">Grid X</Label>
            <Input
              id="block-x"
              type="number"
              value={gridX}
              onChange={(e) => setGridX(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="block-y">Grid Y</Label>
            <Input
              id="block-y"
              type="number"
              value={gridY}
              onChange={(e) => setGridY(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="block-width">Width</Label>
            <Input
              id="block-width"
              type="number"
              value={gridWidth}
              onChange={(e) => setGridWidth(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="block-height">Height</Label>
            <Input
              id="block-height"
              type="number"
              value={gridHeight}
              onChange={(e) => setGridHeight(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
