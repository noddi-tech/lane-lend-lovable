import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BreadcrumbItem {
  type: 'facility' | 'room' | 'zone';
  id: string;
  name: string;
}

interface FacilityBreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

export function FacilityBreadcrumb({ path, onNavigate }: FacilityBreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-sm">
      {path.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <Button
            variant={index === path.length - 1 ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onNavigate(item)}
            className="h-7 gap-1"
          >
            {index === 0 && <Home className="h-3 w-3" />}
            <span>{item.name}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
