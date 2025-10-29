import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFacility } from '@/hooks/admin/useFacilities';

interface CreateFacilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFacilityCreated?: (facilityId: string) => void;
}

export function CreateFacilityDialog({ open, onOpenChange, onFacilityCreated }: CreateFacilityDialogProps) {
  const createFacility = useCreateFacility();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    time_zone: 'Europe/Oslo',
    is_bounded: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createFacility.mutateAsync(formData);

      onOpenChange(false);
      
      // Auto-select the newly created facility
      if (result && 'id' in result && typeof result.id === 'string' && onFacilityCreated) {
        onFacilityCreated(result.id);
      }
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        time_zone: 'Europe/Oslo',
        is_bounded: false,
      });
    } catch (error) {
      // Error is already handled by the mutation (toast shown)
      console.error('Failed to create facility:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Facility</DialogTitle>
          <DialogDescription>
            Design your facility layout on an infinite canvas, then define boundaries later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Facility Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Main Service Center, Downtown Workshop"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Optional description of this facility"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time_zone">Time Zone *</Label>
            <Select
              value={formData.time_zone}
              onValueChange={(value) => setFormData({ ...formData, time_zone: value })}
            >
              <SelectTrigger id="time_zone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Oslo">Europe/Oslo (UTC+1)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (UTC-8)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney (UTC+11)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFacility.isPending}>
              {createFacility.isPending ? 'Creating...' : 'Create Facility'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
