import { useState } from 'react';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { useDrivingGates } from '@/hooks/admin/useDrivingGates';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Building2, Plus, Layers } from 'lucide-react';
import { FacilityOverview } from '@/components/facility/FacilityOverview';
import { FacilityLayoutBuilder } from '@/components/facility/FacilityLayoutBuilder';
import { FacilityConfiguration } from '@/components/facility/FacilityConfiguration';

export default function FacilityManagement() {
  const { data: facilities, isLoading: loadingFacilities } = useFacilities();
  const { data: drivingGates, isLoading: loadingGates } = useDrivingGates();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const selectedFacility = facilities?.find(f => f.id === selectedFacilityId);

  if (loadingFacilities || loadingGates) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading facilities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Facility Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage facilities, driving gates, lanes, and stations in one unified interface
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Facility List */}
        <Card className="col-span-3 p-4 space-y-2 h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Facilities
            </h3>
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1">
            {facilities?.map((facility) => (
              <Button
                key={facility.id}
                variant={selectedFacilityId === facility.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedFacilityId(facility.id)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                <span className="truncate">{facility.name}</span>
              </Button>
            ))}
          </div>

          {facilities?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No facilities yet. Create your first facility to get started.
            </div>
          )}
        </Card>

        {/* Main Content */}
        <div className="col-span-9">
          {selectedFacility ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="layout">Layout Builder</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <FacilityOverview facility={selectedFacility} />
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                <FacilityLayoutBuilder 
                  facility={selectedFacility}
                  drivingGates={drivingGates?.filter(g => g.facility_id === selectedFacility.id) || []}
                />
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <FacilityConfiguration facility={selectedFacility} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <div>
                  <h3 className="text-lg font-semibold">No Facility Selected</h3>
                  <p className="text-muted-foreground">
                    Select a facility from the sidebar or create a new one to get started
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
