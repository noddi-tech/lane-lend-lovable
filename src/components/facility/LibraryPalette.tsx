import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, DoorOpen, Layers, Box, GripVertical, Info, Home, Map, Archive } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLibraryGates } from '@/hooks/admin/useDrivingGates';
import { useLibraryLanes } from '@/hooks/admin/useLanes';
import { useLibraryStations } from '@/hooks/admin/useStations';
import { useLibraryRooms } from '@/hooks/admin/useRooms';
import { useLibraryOutsideAreas } from '@/hooks/admin/useOutsideAreas';
import { useLibraryStorageLocations } from '@/hooks/admin/useStorageLocations';
import { Skeleton } from '@/components/ui/skeleton';

interface LibraryPaletteProps {
  editMode: 'gate' | 'lane' | 'station' | 'room' | 'zone' | 'view' | 'facility' | 'outside' | 'storage';
  onItemDragStart?: (item: LibraryItem, type: 'gate' | 'lane' | 'station' | 'room' | 'zone' | 'outside' | 'storage') => void;
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
  const { data: rooms, isLoading: loadingRooms } = useLibraryRooms();
  const { data: outsideAreas, isLoading: loadingOutside } = useLibraryOutsideAreas();
  const { data: storageLocations, isLoading: loadingStorage } = useLibraryStorageLocations();
  const { data: zones, isLoading: loadingZones } = useLibraryZones();

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
  const filteredRooms = filterItems(rooms);
  const filteredOutsideAreas = filterItems(outsideAreas);
  const filteredStorageLocations = filterItems(storageLocations);
  const filteredZones = filterItems(zones);

  const handleDragStart = (e: React.DragEvent, item: LibraryItem, type: 'gate' | 'lane' | 'station' | 'room' | 'zone' | 'outside' | 'storage') => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ item, type }));
    onItemDragStart?.(item, type);
  };

  const renderLibraryItem = (
    item: LibraryItem,
    type: 'gate' | 'lane' | 'station' | 'room' | 'zone' | 'outside' | 'storage',
    Icon: React.ElementType
  ) => (
    <TooltipProvider key={item.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item, type)}
            className="p-3 border rounded-lg hover:bg-accent hover:border-primary cursor-move transition-all duration-200 group hover:shadow-md animate-fade-in"
          >
            <div className="flex items-start gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-0.5 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110" />
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
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-semibold">{item.name}</p>
          {item.description && <p className="text-xs mt-1">{item.description}</p>}
          <p className="text-xs mt-2 text-muted-foreground">
            Drag and drop onto the canvas to place
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Library Palette</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">How to use</p>
                <p className="text-xs">Drag items from the library onto the canvas to place them in your facility. Switch between tabs to view different types of elements.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <Tabs defaultValue={
          editMode === 'gate' ? 'gates' : 
          editMode === 'lane' ? 'lanes' : 
          editMode === 'station' ? 'stations' :
          editMode === 'room' ? 'rooms' :
          editMode === 'outside' ? 'outside' :
          editMode === 'storage' ? 'storage' :
          'gates'
        }>
        <TabsList className="w-full grid grid-cols-7 mx-4 mb-2" style={{ width: 'calc(100% - 2rem)' }}>
          <TabsTrigger value="gates" className="text-xs px-2">
            <DoorOpen className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="lanes" className="text-xs px-2">
            <Layers className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="stations" className="text-xs px-2">
            <Box className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="rooms" className="text-xs px-2">
            <Home className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="zones" className="text-xs px-2">
            <Square className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="outside" className="text-xs px-2">
            <Map className="h-3 w-3" />
          </TabsTrigger>
          <TabsTrigger value="storage" className="text-xs px-2">
            <Archive className="h-3 w-3" />
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

            <TabsContent value="rooms" className="mt-0 px-4 pb-4 space-y-2">
              {loadingRooms ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No rooms found' : 'No rooms in library'}
                </div>
              ) : (
                filteredRooms.map(room => renderLibraryItem(room, 'room', Home))
              )}
            </TabsContent>

            <TabsContent value="zones" className="mt-0 px-4 pb-4 space-y-2">
              {loadingZones ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredZones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No zones found' : 'No zones in library'}
                </div>
              ) : (
                filteredZones.map(zone => renderLibraryItem(zone, 'zone', Square))
              )}
            </TabsContent>

            <TabsContent value="outside" className="mt-0 px-4 pb-4 space-y-2">
              {loadingOutside ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredOutsideAreas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No outside areas found' : 'No outside areas in library'}
                </div>
              ) : (
                filteredOutsideAreas.map(area => renderLibraryItem(area, 'outside', Map))
              )}
            </TabsContent>

            <TabsContent value="storage" className="mt-0 px-4 pb-4 space-y-2">
              {loadingStorage ? (
                <>
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </>
              ) : filteredStorageLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? 'No storage locations found' : 'No storage locations in library'}
                </div>
              ) : (
                filteredStorageLocations.map(storage => renderLibraryItem(storage, 'storage', Archive))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
