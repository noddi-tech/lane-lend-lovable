import { useParams, useNavigate } from 'react-router-dom';
import { useFacilities } from '@/hooks/admin/useFacilities';
import { useDrivingGates, useUpdateDrivingGate } from '@/hooks/admin/useDrivingGates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FacilityGridBuilder } from '@/components/layouts/FacilityGridBuilder';
import { ArrowLeft, Plus } from 'lucide-react';

export default function FacilityLayout() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { data: facilities } = useFacilities();
  const { data: allGates } = useDrivingGates();
  const updateGate = useUpdateDrivingGate();

  const facility = facilities?.find(f => f.id === facilityId);
  const gates = allGates?.filter(g => g.facility_id === facilityId) || [];

  const handleGateMove = async (gateId: string, x: number, y: number) => {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return;

    await updateGate.mutateAsync({
      id: gateId,
      grid_position_x: x,
      grid_position_y: y,
    });
  };

  const handleGateClick = (gateId: string) => {
    navigate(`/admin/driving-gates/${gateId}`);
  };

  if (!facility) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/facilities')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{facility.name}</h1>
            <p className="text-muted-foreground mt-1">
              {facility.description || 'Facility floor plan'}
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/admin/driving-gates')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driving Gate
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Floor Plan</CardTitle>
            <CardDescription>
              {facility.grid_width} × {facility.grid_height} grid • {gates.length} driving gates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacilityGridBuilder
              gridWidth={facility.grid_width}
              gridHeight={facility.grid_height}
              gates={gates.map(g => ({
                id: g.id,
                name: g.name,
                grid_position_x: g.grid_position_x,
                grid_position_y: g.grid_position_y,
                grid_width: g.grid_width,
                grid_height: g.grid_height,
              }))}
              onGateMove={handleGateMove}
              onGateClick={handleGateClick}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driving Gates</CardTitle>
              <CardDescription>
                Click a gate to view details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {gates.map(gate => (
                <Button
                  key={gate.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleGateClick(gate.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{gate.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Position: ({gate.grid_position_x}, {gate.grid_position_y}) • 
                      Size: {gate.grid_width}×{gate.grid_height}
                    </span>
                  </div>
                </Button>
              ))}
              {gates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No driving gates yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
