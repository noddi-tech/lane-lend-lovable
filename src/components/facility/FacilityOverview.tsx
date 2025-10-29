import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, MapPin, Clock, Grid3x3, Home, Layers, Box, TreePine, Wrench, Package, Edit } from 'lucide-react';
import type { FacilityWithGates } from '@/hooks/admin/useFacilities';
import { useStations } from '@/hooks/admin/useStations';
import { useStorageLocations } from '@/hooks/admin/useStorageLocations';

interface FacilityOverviewProps {
  facility: FacilityWithGates;
  onNavigateToConfig?: () => void;
}

export function FacilityOverview({ facility, onNavigateToConfig }: FacilityOverviewProps) {
  const { data: allStations } = useStations();
  const { data: allStorage } = useStorageLocations();

  // Filter stations and storage by facility's lanes
  const facilityLaneIds = facility.lanes?.map(l => l.id) || [];
  const stationsInFacility = allStations?.filter(s => s.lane_id && facilityLaneIds.includes(s.lane_id)) || [];
  const storageInFacility = allStorage?.filter(s => s.lane_id && facilityLaneIds.includes(s.lane_id)) || [];

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
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div 
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
            onClick={onNavigateToConfig}
            title="Click to edit grid size"
          >
            <Grid3x3 className="h-8 w-8 text-purple-500" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Grid Size</div>
              <div className="text-lg font-semibold">{facility.grid_width} × {facility.grid_height}</div>
            </div>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <MapPin className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Driving Gates</div>
              <div className="text-lg font-semibold">{facility.driving_gates?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Home className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">Rooms</div>
              <div className="text-lg font-semibold">{facility.rooms?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Layers className="h-8 w-8 text-indigo-500" />
            <div>
              <div className="text-sm text-muted-foreground">Lanes</div>
              <div className="text-lg font-semibold">{facility.lanes?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Box className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-sm text-muted-foreground">Zones</div>
              <div className="text-lg font-semibold">{facility.zones?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <TreePine className="h-8 w-8 text-emerald-500" />
            <div>
              <div className="text-sm text-muted-foreground">Outside Areas</div>
              <div className="text-lg font-semibold">{facility.outside_areas?.length || 0}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Wrench className="h-8 w-8 text-orange-500" />
            <div>
              <div className="text-sm text-muted-foreground">Stations</div>
              <div className="text-lg font-semibold">{stationsInFacility.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Package className="h-8 w-8 text-amber-500" />
            <div>
              <div className="text-sm text-muted-foreground">Storage Locations</div>
              <div className="text-lg font-semibold">{storageInFacility.length}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Clock className="h-8 w-8 text-cyan-500" />
            <div>
              <div className="text-sm text-muted-foreground">Time Zone</div>
              <div className="text-lg font-semibold">{facility.time_zone}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facility Elements</CardTitle>
          <CardDescription>Detailed view of all elements in this facility</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            <AccordionItem value="gates">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Driving Gates ({facility.driving_gates?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
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
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No driving gates configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rooms">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-500" />
                  Rooms ({facility.rooms?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {facility.rooms && facility.rooms.length > 0 ? (
                  <div className="space-y-2">
                    {facility.rooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded flex items-center justify-center" style={{ backgroundColor: room.color + '33' }}>
                            <Home className="h-5 w-5" style={{ color: room.color }} />
                          </div>
                          <div>
                            <div className="font-medium">{room.name}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No rooms configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lanes">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-500" />
                  Lanes ({facility.lanes?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {facility.lanes && facility.lanes.length > 0 ? (
                  <div className="space-y-2">
                    {facility.lanes.map((lane) => (
                      <div key={lane.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-indigo-500/20 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                            <div className="font-medium">{lane.name}</div>
                            <div className="text-sm text-muted-foreground">Type: {lane.lane_type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No lanes configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="zones">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Box className="h-4 w-4 text-purple-500" />
                  Zones ({facility.zones?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {facility.zones && facility.zones.length > 0 ? (
                  <div className="space-y-2">
                    {facility.zones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-purple-500/20 flex items-center justify-center">
                            <Box className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <div className="font-medium">{zone.name}</div>
                            <div className="text-sm text-muted-foreground">Type: {zone.zone_type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No zones configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="outside">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-emerald-500" />
                  Outside Areas ({facility.outside_areas?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {facility.outside_areas && facility.outside_areas.length > 0 ? (
                  <div className="space-y-2">
                    {facility.outside_areas.map((area) => (
                      <div key={area.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-emerald-500/20 flex items-center justify-center">
                            <TreePine className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <div className="font-medium">{area.name}</div>
                            <div className="text-sm text-muted-foreground">Type: {area.area_type}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No outside areas configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="stations">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  Stations ({stationsInFacility.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {stationsInFacility.length > 0 ? (
                  <div className="space-y-2">
                    {stationsInFacility.map((station) => (
                      <div key={station.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-orange-500/20 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <div className="font-medium">{station.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {station.station_type} • Lane: {station.lane?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No stations configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="storage">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-500" />
                  Storage Locations ({storageInFacility.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {storageInFacility.length > 0 ? (
                  <div className="space-y-2">
                    {storageInFacility.map((storage) => (
                      <div key={storage.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-amber-500/20 flex items-center justify-center">
                            <Package className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <div className="font-medium">{storage.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Type: {storage.storage_type} • Status: {storage.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No storage locations configured
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
