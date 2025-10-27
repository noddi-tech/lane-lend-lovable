import { useState } from 'react';
import { useStations } from '@/hooks/admin/useStations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StationSelectorProps {
  selectedStationIds: string[];
  onStationAdd: (stationId: string) => void;
  requiredCapabilities?: string[];
}

const STATION_TYPE_ICONS: Record<string, string> = {
  lifting_jack: '🔧',
  tire_mount: '🔩',
  diagnostic: '💻',
  alignment: '📐',
  general: '🛠️',
};

const STATION_TYPE_LABELS: Record<string, string> = {
  lifting_jack: 'Lifting Jack',
  tire_mount: 'Tire Mount',
  diagnostic: 'Diagnostic',
  alignment: 'Wheel Alignment',
  general: 'General Service',
};

export const StationSelector = ({ 
  selectedStationIds, 
  onStationAdd,
  requiredCapabilities = []
}: StationSelectorProps) => {
  const { data: allStations } = useStations();
  const [selectedLaneId, setSelectedLaneId] = useState<string>('all');

  // Get unique lanes from stations
  const lanes = Array.from(
    new Map(
      allStations
        ?.filter(s => s.lane)
        .map(s => [s.lane!.id, s.lane!])
    ).values()
  );

  // Filter stations by selected lane and capabilities
  const availableStations = allStations?.filter(station => {
    const alreadySelected = selectedStationIds.includes(station.id);
    const matchesLane = selectedLaneId === 'all' || station.lane_id === selectedLaneId;
    
    // Check if station has all required capabilities
    const hasCapabilities = requiredCapabilities.length === 0 || 
      requiredCapabilities.every(reqCap => 
        station.capabilities?.some(cap => cap.id === reqCap)
      );
    
    return !alreadySelected && matchesLane && hasCapabilities;
  }) || [];

  const handleAddStation = (stationId: string) => {
    onStationAdd(stationId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedLaneId} onValueChange={setSelectedLaneId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by lane" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lanes</SelectItem>
            {lanes.map(lane => (
              <SelectItem key={lane.id} value={lane.id}>
                {lane.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {requiredCapabilities.length > 0 && (
          <Badge variant="outline">
            Filtered by service requirements
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableStations.map(station => (
          <Card key={station.id} className="hover:border-primary transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {STATION_TYPE_ICONS[station.station_type] || '🛠️'}
                  </span>
                  <div>
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {STATION_TYPE_LABELS[station.station_type] || station.station_type}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {station.lane && (
                <div className="text-sm text-muted-foreground">
                  Lane: {station.lane.name}
                </div>
              )}
              
              {station.capabilities && station.capabilities.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1">Capabilities:</div>
                  <div className="flex flex-wrap gap-1">
                    {station.capabilities.map(cap => (
                      <Badge key={cap.id} variant="secondary" className="text-xs">
                        {cap.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                onClick={() => handleAddStation(station.id)}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Sequence
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableStations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {selectedStationIds.length > 0 
              ? 'All compatible stations have been selected'
              : 'No stations available matching your criteria'}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
