import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, DoorOpen, Layers, Box, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLibraryGates } from '@/hooks/admin/useDrivingGates';
import { useLibraryLanes } from '@/hooks/admin/useLanes';
import { useLibraryStations } from '@/hooks/admin/useStations';
import { Skeleton } from '@/components/ui/skeleton';

interface LibraryPaletteProps {
  editMode: 'gate' | 'lane' | 'station' | 'room' | 'view' | 'facility';
  onItemDragStart?: (item: LibraryItem, type: 'gate' | 'lane' | 'station') => void;
}

export interface LibraryItem {
  id: string;
  name: string;
  description?: string | null;
  grid_width?: number;
  grid_height: number;
  [key: string]: any;
}

export function LibraryPalette({ editMode, onItemDragStart }: LibraryPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: gates, isLoading: loadingGates } = useLibraryGates();
  const { data: lanes, isLoading: loadingLanes } = useLibraryLanes();
  const { data: stations, isLoading: loadingStations } = useLibraryStations();

  const filterItems = <T extends LibraryItem>(items: T[] | undefined): T[] => {
    if (!items) return [];
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  };

  const filteredGates = filterItems(gates);
  const filteredLanes = filterItems(lanes);
  const filteredStations = filterItems(stations);

  const handleDragStart = (e: React.DragEvent, item: LibraryItem, type: 'gate' | 'lane' | 'station') => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
    onItemDragStart?.(item, type);
  };

  const renderLibraryItem = (
    item: LibraryItem,
    type: 'gate' | 'lane' | 'station',
    Icon: React.ElementType
  ) => (
    <div
      key={item.id}
      draggable
      onDragStart={(e) => handleDragStart(e, item, type)}
      className="p-3 border rounded-lg hover:bg-accent hover:border-primary cursor-move transition-colors group"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 flex-shrink-0" />
            <h4 className="font-medium text-sm truncate">{item.name}</h4>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-xs">
              {item.grid_width || 'auto'} × {item.grid_height}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  if (editMode === 'view' || editMode === 'facility') {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="text-lg">Library</CardTitle>
          <CardDescription>
            Switch to edit mode to use library items
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Library Palette</CardTitle>
        <CardDescription>
          Drag items onto the canvas to place them
        </CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={editMode === 'gate' ? 'gates' : editMode === 'lane' ? 'lanes' : 'stations'}>
          <TabsList className="w-full grid grid-cols-3 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="gates" className="text-xs">
              <DoorOpen className="h-3 w-3 mr-1" />
              Gates
            </TabsTrigger>
            <TabsTrigger value="lanes" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Lanes
            </TabsTrigger>
            <TabsTrigger value="stations" className="text-xs">
              <Box className="h-3 w-3 mr-1" />
              Stations
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px]">
            <TabsContent value="gates" className="mt-0 px-4 pb-4 space-y-2">
              {loadingGates ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredGates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No gates found' : 'No gates in library'}
                </div>
              ) : (
                filteredGates.map(gate => renderLibraryItem(gate, 'gate', DoorOpen))
              )}
            </TabsContent>

            <TabsContent value="lanes" className="mt-0 px-4 pb-4 space-y-2">
              {loadingLanes ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredLanes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No lanes found' : 'No lanes in library'}
                </div>
              ) : (
                filteredLanes.map(lane => renderLibraryItem(lane, 'lane', Layers))
              )}
            </TabsContent>

            <TabsContent value="stations" className="mt-0 px-4 pb-4 space-y-2">
              {loadingStations ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredStations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No stations found' : 'No stations in library'}
                </div>
              ) : (
                filteredStations.map(station => renderLibraryItem(station, 'station', Box))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
