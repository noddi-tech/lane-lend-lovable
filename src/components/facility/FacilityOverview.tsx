import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Clock, Grid3x3 } from 'lucide-react';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';

interface FacilityOverviewProps {
  facility: FacilityWithGates;
}

export function FacilityOverview({ facility }: FacilityOverviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{facility.name}</CardTitle>
              <CardDescription>{facility.description || 'No description provided'}</CardDescription>
            </div>
            <Badge variant="outline" className="text-primary">
              <Building2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Grid3x3 className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-sm text-muted-foreground">Grid Size</div>
              <div className="text-lg font-semibold">{facility.grid_width} × {facility.grid_height}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <MapPin className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Driving Gates</div>
              <div className="text-lg font-semibold">{facility.driving_gates?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-sm text-muted-foreground">Time Zone</div>
              <div className="text-lg font-semibold">{facility.time_zone}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Driving Gates</CardTitle>
          <CardDescription>Gates within this facility</CardDescription>
        </CardHeader>
        <CardContent>
          {facility.driving_gates && facility.driving_gates.length > 0 ? (
            <div className="space-y-2">
              {facility.driving_gates.map((gate) => (
                <div key={gate.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-blue-500/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">{gate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Position: ({gate.grid_position_x}, {gate.grid_position_y}) • Size: {gate.grid_width}×{gate.grid_height}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No driving gates configured for this facility
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
