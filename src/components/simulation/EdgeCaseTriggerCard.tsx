import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Zap, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EdgeCaseTrigger {
  id: string;
  label: string;
  description: string;
  type: 'generator' | 'analyzer';
  minBookings?: number;
  enabled: boolean;
  available: boolean;
  reason?: string;
}

interface EdgeCaseTriggerCardProps {
  trigger: EdgeCaseTrigger;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  currentBookings: number;
}

export default function EdgeCaseTriggerCard({
  trigger,
  checked,
  onCheckedChange,
  currentBookings,
}: EdgeCaseTriggerCardProps) {
  const isDisabled = !trigger.available;
  const needsMoreBookings = trigger.minBookings && currentBookings < trigger.minBookings;

  return (
    <div
      className={`border rounded-lg p-4 space-y-2 ${
        isDisabled ? 'opacity-50 bg-muted/30' : 'hover:bg-muted/50'
      } transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            id={trigger.id}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={isDisabled}
            className="mt-1"
          />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Label
                htmlFor={trigger.id}
                className={`font-medium ${isDisabled ? '' : 'cursor-pointer'}`}
              >
                {trigger.label}
              </Label>
              <Badge variant={trigger.type === 'generator' ? 'default' : 'secondary'} className="text-xs">
                {trigger.type === 'generator' ? (
                  <><Zap className="h-3 w-3 mr-1" />Generator</>
                ) : (
                  <><Search className="h-3 w-3 mr-1" />Analyzer</>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{trigger.description}</p>
            {trigger.minBookings && (
              <div className="text-xs text-muted-foreground">
                Requires: {trigger.minBookings}+ bookings
                {needsMoreBookings && (
                  <span className="text-destructive ml-1">
                    (only {currentBookings} available)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {isDisabled && trigger.reason && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{trigger.reason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
