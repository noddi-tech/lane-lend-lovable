import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Trash2 } from 'lucide-react';

interface Station {
  id: string;
  name: string;
  station_type: string;
  lane?: { name: string };
}

interface StationSequenceProps {
  stations: Station[];
  onRemove?: (stationId: string) => void;
  showActions?: boolean;
}

const STATION_TYPE_ICONS: Record<string, string> = {
  lifting_jack: '🔧',
  tire_mount: '🔩',
  diagnostic: '💻',
  alignment: '📐',
  general: '🛠️',
};

export const StationSequence = ({ stations, onRemove, showActions = false }: StationSequenceProps) => {
  if (stations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No stations selected yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {stations.map((station, index) => (
          <div key={station.id} className="flex items-center gap-2">
            <Card className="flex-shrink-0">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{STATION_TYPE_ICONS[station.station_type] || '🛠️'}</span>
                    <div>
                      <CardTitle className="text-sm">
                        {index + 1}. {station.name}
                      </CardTitle>
                      {station.lane && (
                        <CardDescription className="text-xs">
                          {station.lane.name}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {showActions && onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(station.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
            {index < stations.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">Sequential Service</Badge>
        <span>Your vehicle will visit {stations.length} station{stations.length > 1 ? 's' : ''} in order</span>
      </div>
    </div>
  );
};
