import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Layers, Square } from 'lucide-react';
import { UnifiedGridBuilder } from '@/components/facility/UnifiedGridBuilder';
import { useUpdateDrivingGate } from '@/hooks/admin/useDrivingGates';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import type { DrivingGateWithLanes } from '@/hooks/admin/useDrivingGates';

type EditMode = 'facility' | 'gates' | 'lanes' | 'stations';

interface FacilityLayoutBuilderProps {
  facility: FacilityWithGates;
  drivingGates: DrivingGateWithLanes[];
}

export function FacilityLayoutBuilder({ facility, drivingGates }: FacilityLayoutBuilderProps) {
  const [editMode, setEditMode] = useState<EditMode>('gates');
  const updateGate = useUpdateDrivingGate();

  const handleGateMove = async (gateId: string, x: number, y: number) => {
    await updateGate.mutateAsync({
      id: gateId,
      grid_position_x: x,
      grid_position_y: y,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Unified Layout Editor
          </CardTitle>
          <CardDescription>
            Edit facility layout, gates, lanes, and stations in one view
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Edit Mode Selector */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={editMode === 'facility' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('facility')}
            >
              <Building2 className="h-4 w-4 mr-2" />
              Facility
              <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-400 border-0">
                Grid
              </Badge>
            </Button>
            <Button
              variant={editMode === 'gates' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('gates')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Driving Gates
              <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-400 border-0">
                {drivingGates.length}
              </Badge>
            </Button>
            <Button
              variant={editMode === 'lanes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('lanes')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Lanes
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-0">
                0
              </Badge>
            </Button>
            <Button
              variant={editMode === 'stations' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditMode('stations')}
            >
              <Square className="h-4 w-4 mr-2" />
              Stations
              <Badge variant="secondary" className="ml-2 bg-orange-500/20 text-orange-400 border-0">
                0
              </Badge>
            </Button>
          </div>

          {/* Legend */}
          <div className="flex gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500/20 border-2 border-purple-500" />
              <span className="text-muted-foreground">Facility Grid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500" />
              <span className="text-muted-foreground">Driving Gates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500" />
              <span className="text-muted-foreground">Lanes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border-2 border-orange-500" />
              <span className="text-muted-foreground">Stations</span>
            </div>
          </div>

          {/* Unified Grid Canvas */}
          <UnifiedGridBuilder
            gridWidth={facility.grid_width}
            gridHeight={facility.grid_height}
            gates={drivingGates.map(g => ({
              id: g.id,
              name: g.name,
              grid_position_x: g.grid_position_x || 0,
              grid_position_y: g.grid_position_y || 0,
              grid_width: g.grid_width,
              grid_height: g.grid_height,
            }))}
            lanes={[]}
            stations={[]}
            editMode={editMode}
            onGateMove={handleGateMove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
