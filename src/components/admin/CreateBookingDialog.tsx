import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Loader2, Zap } from 'lucide-react';
import { useSalesItems } from '@/hooks/useSalesItems';
import { AlertTriangle } from 'lucide-react';
import { useCompatibleLanes } from '@/hooks/admin/useCompatibleLanes';
import { useAvailability } from '@/hooks/useAvailability';
import { useCreateAdhocBooking, useCreateScheduledBooking } from '@/hooks/admin/useCreateAdminBooking';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AvailabilitySlot } from '@/types/booking';
import VehicleFields from './VehicleFields';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateBookingDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<string>('scheduled');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Booking</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="adhoc">Ad-hoc</TabsTrigger>
          </TabsList>
          <TabsContent value="scheduled">
            <ScheduledBookingForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="adhoc">
            <AdhocBookingForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──
function roundToNearest5(date: Date): Date {
  const d = new Date(date);
  const mins = d.getMinutes();
  d.setMinutes(Math.ceil(mins / 5) * 5, 0, 0);
  return d;
}

function toTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

// ── Scheduled Booking Form ──
function ScheduledBookingForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: salesItems } = useSalesItems();
  const { data: availability, isLoading: loadingSlots } = useAvailability({
    date: selectedDate,
    salesItemIds: selectedItems,
  });
  const createBooking = useCreateScheduledBooking();

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setSelectedSlot(null);
  };

  const handleSubmit = () => {
    if (!selectedSlot) return;
    createBooking.mutate(
      {
        sales_item_ids: selectedItems,
        delivery_window_starts_at: selectedSlot.starts_at,
        delivery_window_ends_at: selectedSlot.ends_at,
        lane_id: selectedSlot.lane_id,
        vehicle_make: vehicleMake || undefined,
        vehicle_model: vehicleModel || undefined,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicle_registration: vehicleReg || undefined,
        admin_notes: adminNotes || undefined,
      },
      { onSuccess }
    );
  };

  return (
    <div className="space-y-4 pt-4">
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Step 1: Select Services</h3>
          <div className="grid gap-2">
            {salesItems?.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedItems.includes(item.id)}
                  onCheckedChange={() => toggleItem(item.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  )}
                </div>
                <Badge variant="outline">
                  {Math.round(item.service_time_seconds / 60)} min
                </Badge>
              </label>
            ))}
          </div>
          <Button onClick={() => setStep(2)} disabled={selectedItems.length === 0} className="w-full">
            Next: Pick Date & Slot
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Step 2: Pick Date & Slot</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left', !selectedDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(d) => { setSelectedDate(d || null); setSelectedSlot(null); }}
                disabled={(d) => d < new Date()}
              />
            </PopoverContent>
          </Popover>

          {loadingSlots && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {availability?.slots && availability.slots.length > 0 && (
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {availability.slots.map(slot => (
                <Card
                  key={`${slot.interval_id}-${slot.lane_id}`}
                  className={cn(
                    'cursor-pointer transition-colors',
                    selectedSlot?.interval_id === slot.interval_id && selectedSlot?.lane_id === slot.lane_id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(new Date(slot.starts_at), 'HH:mm')} – {format(new Date(slot.ends_at), 'HH:mm')}
                      </span>
                    </div>
                    <Badge variant="outline">{slot.lane_name}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedDate && !loadingSlots && availability?.slots?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No available slots on this date
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={() => setStep(3)} disabled={!selectedSlot} className="flex-1">
              Next: Vehicle Info
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-muted-foreground">Step 3: Vehicle & Notes (optional)</h3>
          <VehicleFields
            make={vehicleMake}
            model={vehicleModel}
            year={vehicleYear}
            registration={vehicleReg}
            onMakeChange={setVehicleMake}
            onModelChange={setVehicleModel}
            onYearChange={setVehicleYear}
            onRegistrationChange={setVehicleReg}
            optional
          />
          <div>
            <Label>Admin Notes</Label>
            <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} disabled={createBooking.isPending} className="flex-1">
              {createBooking.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ad-hoc Booking Form ──
function AdhocBookingForm({ onSuccess }: { onSuccess: () => void }) {
  const [isNow, setIsNow] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [laneId, setLaneId] = useState('');
  const [laneOverride, setLaneOverride] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [serviceMinutes, setServiceMinutes] = useState('60');
  const [serviceTimeOverridden, setServiceTimeOverridden] = useState(false);
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: salesItems } = useSalesItems();
  const { data: laneData, isLoading: lanesLoading } = useCompatibleLanes(selectedItems, laneOverride);
  const createAdhoc = useCreateAdhocBooking();

  const displayedLanes = laneOverride ? laneData?.allLanes : laneData?.lanes;
  const noCompatibleLanes = laneData?.isFiltered && laneData.lanes.length === 0 && !laneOverride;

  // Auto-sum service time from selected sales items
  useEffect(() => {
    if (serviceTimeOverridden || !salesItems || selectedItems.length === 0) return;
    const totalSeconds = salesItems
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.service_time_seconds, 0);
    if (totalSeconds > 0) {
      setServiceMinutes(String(Math.round(totalSeconds / 60)));
    }
  }, [selectedItems, salesItems, serviceTimeOverridden]);

  // Reset lane if no longer compatible
  useEffect(() => {
    if (!laneId || !displayedLanes) return;
    if (!displayedLanes.find(l => l.id === laneId)) {
      setLaneId('');
      if (selectedItems.length > 0 && !laneOverride) {
        toast.info('Lane reset — no longer compatible with selected services');
      }
    }
  }, [displayedLanes, laneId, selectedItems.length, laneOverride]);

  // Auto-select lane if only one compatible
  useEffect(() => {
    if (displayedLanes?.length === 1 && !laneId) {
      setLaneId(displayedLanes[0].id);
    }
  }, [displayedLanes, laneId]);

  // Reset override when services change
  useEffect(() => {
    setLaneOverride(false);
  }, [selectedItems]);

  // "Now" toggle logic
  const applyNow = () => {
    const now = roundToNearest5(new Date());
    setDate(toDateString(now));
    setStartTime(toTimeString(now));
    const end = new Date(now.getTime() + parseInt(serviceMinutes || '60') * 60 * 1000);
    setEndTime(toTimeString(end));
  };

  const handleNowToggle = (checked: boolean) => {
    setIsNow(checked);
    if (checked) applyNow();
  };

  // Recalculate end time when service minutes changes while in "Now" mode
  useEffect(() => {
    if (!isNow) return;
    const mins = parseInt(serviceMinutes);
    if (isNaN(mins) || mins <= 0) return;
    const start = new Date(`${date}T${startTime}:00`);
    if (isNaN(start.getTime())) return;
    const end = new Date(start.getTime() + mins * 60 * 1000);
    setEndTime(toTimeString(end));
  }, [serviceMinutes, isNow, date, startTime]);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setServiceTimeOverridden(false);
  };

  const handleSubmit = () => {
    if (!laneId || !date || !startTime || !endTime) return;
    const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endsAt = new Date(`${date}T${endTime}:00`).toISOString();

    createAdhoc.mutate(
      {
        lane_id: laneId,
        delivery_window_starts_at: startsAt,
        delivery_window_ends_at: endsAt,
        service_time_seconds: parseInt(serviceMinutes) * 60,
        sales_item_ids: selectedItems.length > 0 ? selectedItems : undefined,
        vehicle_make: vehicleMake || undefined,
        vehicle_model: vehicleModel || undefined,
        vehicle_year: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicle_registration: vehicleReg || undefined,
        admin_notes: adminNotes || undefined,
      },
      { onSuccess }
    );
  };

  const isValid = laneId && date && startTime && endTime && parseInt(serviceMinutes) > 0;

  return (
    <div className="space-y-4 pt-4">
      {/* "Happening Now" toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <div>
            <div className="text-sm font-medium">Happening Now</div>
            <div className="text-xs text-muted-foreground">Auto-fill date & time to right now</div>
          </div>
        </div>
        <Switch checked={isNow} onCheckedChange={handleNowToggle} />
      </div>

      {/* Services (Sales Items) */}
      <div>
        <Label>Services</Label>
        <div className="grid gap-1 mt-1 max-h-40 overflow-y-auto">
          {salesItems?.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
              <Checkbox
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => toggleItem(item.id)}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{item.name}</div>
              </div>
              <Badge variant="outline">
                {Math.round(item.service_time_seconds / 60)} min
              </Badge>
            </label>
          ))}
        </div>
      </div>

      {/* Lane — filtered by capabilities with admin override */}
      <div>
        <Label className="flex items-center gap-2">
          Lane *
          {laneData?.isFiltered && !laneOverride && displayedLanes && displayedLanes.length > 0 && (
            <Badge variant="secondary" className="text-xs">filtered by services</Badge>
          )}
          {laneOverride && (
            <Badge className="text-xs bg-amber-500/15 text-amber-600 border-amber-300 hover:bg-amber-500/20">
              ⚠ admin override
            </Badge>
          )}
        </Label>

        {noCompatibleLanes && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 mt-1 mb-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-600 text-sm mt-0.5">⚠</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  No lanes match the required capabilities
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  The selected services require capabilities that no lane currently provides.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs border-amber-400 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                  onClick={() => setLaneOverride(true)}
                >
                  Show all lanes (override)
                </Button>
              </div>
            </div>
          </div>
        )}

        <Select value={laneId} onValueChange={setLaneId}>
          <SelectTrigger>
            <SelectValue placeholder={lanesLoading ? 'Loading...' : 'Select lane'} />
          </SelectTrigger>
          <SelectContent>
            {displayedLanes?.map(lane => (
              <SelectItem key={lane.id} value={lane.id}>{lane.name}</SelectItem>
            ))}
            {!noCompatibleLanes && displayedLanes?.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No lanes available</div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Date *</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isNow} />
        </div>
        <div>
          <Label>Start *</Label>
          <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={isNow} />
        </div>
        <div>
          <Label>End *</Label>
          <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} disabled={isNow} />
        </div>
      </div>

      {/* Service time */}
      <div>
        <Label>
          Service Time (minutes) *
          {selectedItems.length > 0 && !serviceTimeOverridden && (
            <span className="text-xs text-muted-foreground ml-2">(auto-calculated)</span>
          )}
        </Label>
        <Input
          type="number"
          value={serviceMinutes}
          onChange={e => { setServiceMinutes(e.target.value); setServiceTimeOverridden(true); }}
          min="1"
        />
      </div>

      {/* Vehicle info */}
      <VehicleFields
        make={vehicleMake}
        model={vehicleModel}
        year={vehicleYear}
        registration={vehicleReg}
        onMakeChange={setVehicleMake}
        onModelChange={setVehicleModel}
        onYearChange={setVehicleYear}
        onRegistrationChange={setVehicleReg}
        optional
      />

      {/* Notes */}
      <div>
        <Label className="text-muted-foreground">Admin Notes</Label>
        <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} />
      </div>

      <Button onClick={handleSubmit} disabled={!isValid || createAdhoc.isPending} className="w-full">
        {createAdhoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Create Ad-hoc Booking
      </Button>
    </div>
  );
}
