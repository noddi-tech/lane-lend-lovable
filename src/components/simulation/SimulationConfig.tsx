import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

export interface SimulationConfigData {
  customerVolume: {
    mode: 'light' | 'normal' | 'heavy';
    multiplier: number;
  };
  timeDistribution: {
    mode: 'realistic' | 'rush-hour' | 'evenly-spread';
    rushStart?: string;
    rushEnd?: string;
  };
  edgeCaseTriggers: {
    overbooking: boolean;
    capabilityMismatch: boolean;
    workerUnavailability: boolean;
    extendedServices: boolean;
    lastMinuteCancellations: boolean;
    rushHour: boolean;
  };
}

interface SimulationConfigProps {
  config: SimulationConfigData;
  onChange: (config: SimulationConfigData) => void;
}

export default function SimulationConfig({ config, onChange }: SimulationConfigProps) {
  const updateConfig = (updates: Partial<SimulationConfigData>) => {
    onChange({ ...config, ...updates });
  };

  const updateEdgeCases = (trigger: keyof SimulationConfigData['edgeCaseTriggers'], value: boolean) => {
    updateConfig({
      edgeCaseTriggers: {
        ...config.edgeCaseTriggers,
        [trigger]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Volume</CardTitle>
          <CardDescription>Adjust the number of simulated bookings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={config.customerVolume.mode}
            onValueChange={(value) =>
              updateConfig({
                customerVolume: {
                  mode: value as 'light' | 'normal' | 'heavy',
                  multiplier: value === 'light' ? 0.5 : value === 'heavy' ? 2.0 : 1.0,
                },
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light (50% normal)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal">Normal (100%)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="heavy" id="heavy" />
              <Label htmlFor="heavy">Heavy (200%)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time Distribution</CardTitle>
          <CardDescription>How bookings are spread throughout the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={config.timeDistribution.mode}
            onValueChange={(value) =>
              updateConfig({
                timeDistribution: {
                  ...config.timeDistribution,
                  mode: value as 'realistic' | 'rush-hour' | 'evenly-spread',
                },
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="realistic" id="realistic" />
              <Label htmlFor="realistic">Realistic (peak hours)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rush-hour" id="rush-hour" />
              <Label htmlFor="rush-hour">Rush Hour Spike</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="evenly-spread" id="evenly-spread" />
              <Label htmlFor="evenly-spread">Evenly Spread</Label>
            </div>
          </RadioGroup>

          {config.timeDistribution.mode === 'rush-hour' && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="rush-start">Rush Start</Label>
                <Input
                  id="rush-start"
                  type="time"
                  value={config.timeDistribution.rushStart || '10:00'}
                  onChange={(e) =>
                    updateConfig({
                      timeDistribution: {
                        ...config.timeDistribution,
                        rushStart: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rush-end">Rush End</Label>
                <Input
                  id="rush-end"
                  type="time"
                  value={config.timeDistribution.rushEnd || '12:00'}
                  onChange={(e) =>
                    updateConfig({
                      timeDistribution: {
                        ...config.timeDistribution,
                        rushEnd: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edge Case Triggers</CardTitle>
          <CardDescription>Select which scenarios to simulate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overbooking"
              checked={config.edgeCaseTriggers.overbooking}
              onCheckedChange={(checked) => updateEdgeCases('overbooking', checked as boolean)}
            />
            <Label htmlFor="overbooking" className="cursor-pointer">
              Overbooking - Create bookings exceeding capacity
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rushHour"
              checked={config.edgeCaseTriggers.rushHour}
              onCheckedChange={(checked) => updateEdgeCases('rushHour', checked as boolean)}
            />
            <Label htmlFor="rushHour" className="cursor-pointer">
              Rush Hour - Concentrate 70% of bookings in 2-hour window
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="capabilityMismatch"
              checked={config.edgeCaseTriggers.capabilityMismatch}
              onCheckedChange={(checked) => updateEdgeCases('capabilityMismatch', checked as boolean)}
            />
            <Label htmlFor="capabilityMismatch" className="cursor-pointer">
              Capability Mismatch - Services requiring unavailable capabilities
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lastMinuteCancellations"
              checked={config.edgeCaseTriggers.lastMinuteCancellations}
              onCheckedChange={(checked) =>
                updateEdgeCases('lastMinuteCancellations', checked as boolean)
              }
            />
            <Label htmlFor="lastMinuteCancellations" className="cursor-pointer">
              Last-Minute Cancellations - Cancel 15% of bookings
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="workerUnavailability"
              checked={config.edgeCaseTriggers.workerUnavailability}
              onCheckedChange={(checked) => updateEdgeCases('workerUnavailability', checked as boolean)}
            />
            <Label htmlFor="workerUnavailability" className="cursor-pointer">
              Worker Unavailability - Remove worker mid-day
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="extendedServices"
              checked={config.edgeCaseTriggers.extendedServices}
              onCheckedChange={(checked) => updateEdgeCases('extendedServices', checked as boolean)}
            />
            <Label htmlFor="extendedServices" className="cursor-pointer">
              Extended Services - Jobs running 30-60 min over time
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
