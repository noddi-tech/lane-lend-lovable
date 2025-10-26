import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSystemReadiness } from '@/hooks/admin/useSystemReadiness';

export default function SystemStatusBadge() {
  const { data: readiness, isLoading } = useSystemReadiness();

  if (isLoading) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking...
      </Badge>
    );
  }

  if (!readiness) return null;

  if (readiness.overallReady) {
    return (
      <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
        <CheckCircle2 className="h-3 w-3" />
        Ready for Bookings
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      Incomplete Setup
    </Badge>
  );
}
