import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Activity, BarChart3, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'bookings' | 'workers' | 'capacity' | 'general';
  title?: string;
  message?: string;
  showAction?: boolean;
}

export function EmptyState({ type, title, message, showAction = true }: EmptyStateProps) {
  const config = {
    bookings: {
      icon: Calendar,
      defaultTitle: 'No Bookings Found',
      defaultMessage: 'There are no bookings in the selected date range. Create test data or wait for customer bookings to see analytics.',
      actionText: 'Generate Test Data',
      actionLink: '/admin/seed-data'
    },
    workers: {
      icon: Users,
      defaultTitle: 'No Worker Data',
      defaultMessage: 'Worker contributions exist but no bookings have been assigned yet. Generate test bookings to see utilization metrics.',
      actionText: 'Generate Test Data',
      actionLink: '/admin/seed-data'
    },
    capacity: {
      icon: Activity,
      defaultTitle: 'No Capacity Data',
      defaultMessage: 'Capacity intervals are available but no bookings have consumed capacity yet. Create test bookings to see utilization.',
      actionText: 'Generate Test Data',
      actionLink: '/admin/seed-data'
    },
    general: {
      icon: BarChart3,
      defaultTitle: 'No Data Available',
      defaultMessage: 'No data found for the selected filters and date range.',
      actionText: 'Adjust Filters',
      actionLink: '#'
    }
  };

  const { icon: Icon, defaultTitle, defaultMessage, actionText, actionLink } = config[type];

  return (
    <Card className="p-12">
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-muted p-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title || defaultTitle}</h3>
          <p className="text-muted-foreground max-w-md">
            {message || defaultMessage}
          </p>
        </div>
        {showAction && actionLink !== '#' && (
          <Button asChild>
            <Link to={actionLink}>
              <Database className="mr-2 h-4 w-4" />
              {actionText}
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
