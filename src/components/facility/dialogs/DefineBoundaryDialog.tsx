import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { useUpdateFacility } from '@/hooks/admin/useFacilities';
import { calculateOptimalBoundary } from '@/utils/facilityBoundaryCalculator';
import { LayoutBlock } from '@/components/facility/BlockGridBuilder';
import { toast } from 'sonner';

interface DefineBoundaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  blocks: LayoutBlock[];
}

export function DefineBoundaryDialog({ 
  open, 
  onOpenChange,
  facilityId,
  blocks 
}: DefineBoundaryDialogProps) {
  const [margin, setMargin] = useState(5);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [manualWidth, setManualWidth] = useState(100);
  const [manualHeight, setManualHeight] = useState(100);
  const updateFacility = useUpdateFacility();
  
  const boundary = calculateOptimalBoundary(blocks, margin);
  
  const handleApply = async () => {
    try {
      const updates = mode === 'auto' 
        ? {
            id: facilityId,
            grid_width: boundary.grid_width,
            grid_height: boundary.grid_height,
            is_bounded: true,
            boundary_margin: margin,
            boundary_mode: 'auto' as const,
          }
        : {
            id: facilityId,
            grid_width: manualWidth,
            grid_height: manualHeight,
            is_bounded: true,
            boundary_mode: 'manual' as const,
          };
      
      await updateFacility.mutateAsync(updates as any);
      toast.success('Boundary applied successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to apply boundary');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Define Facility Boundary</DialogTitle>
          <DialogDescription>
            Set the facility boundary based on placed elements
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auto">Auto-Fit</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="space-y-4">
            <div className="space-y-2">
              <Label>Margin (grid units)</Label>
              <Slider
                value={[margin]}
                onValueChange={([v]) => setMargin(v)}
                min={0}
                max={20}
                step={1}
              />
              <p className="text-sm text-muted-foreground">
                {margin} grid units around all elements
              </p>
            </div>
            
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Calculated Boundary</h4>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Width:</span>
                  <span className="ml-2 font-mono font-semibold">{boundary.grid_width}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Height:</span>
                  <span className="ml-2 font-mono font-semibold">{boundary.grid_height}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <span className="ml-2 font-mono">({boundary.grid_x}, {boundary.grid_y})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Elements:</span>
                  <span className="ml-2 font-mono">{boundary.elements_count}</span>
                </div>
              </div>
            </div>
            
            {blocks.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No elements placed yet. The boundary will default to 100×100.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  The boundary will fit all {boundary.elements_count} elements 
                  with a {margin}-unit margin on all sides.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-width">Width</Label>
                <Input
                  id="manual-width"
                  type="number"
                  min={50}
                  max={500}
                  value={manualWidth}
                  onChange={(e) => setManualWidth(parseInt(e.target.value) || 100)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-height">Height</Label>
                <Input
                  id="manual-height"
                  type="number"
                  min={50}
                  max={500}
                  value={manualHeight}
                  onChange={(e) => setManualHeight(parseInt(e.target.value) || 100)}
                />
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Set custom boundary dimensions. Elements may extend beyond this boundary.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={updateFacility.isPending}>
            {updateFacility.isPending ? 'Applying...' : 'Apply Boundary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
