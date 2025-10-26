import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Filter } from 'lucide-react';
import {
  useContributions,
  useCreateContribution,
  useUpdateContribution,
  useDeleteContribution,
  type ContributionWithDetails,
  type ContributionFilters,
} from '@/hooks/admin/useContributions';
import { useWorkers } from '@/hooks/admin/useWorkers';
import { useLanes } from '@/hooks/admin/useLanes';
import { format } from 'date-fns';

export default function Contributions() {
  const [filters, setFilters] = useState<ContributionFilters>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<ContributionWithDetails | null>(null);
  const [deletingContributionId, setDeletingContributionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    worker_id: '',
    lane_id: '',
    starts_at: '',
    ends_at: '',
    available_seconds: 28800, // 8 hours default
    travel_factor: 1.0,
    performance_factor: 1.0,
  });

  const { data: contributions, isLoading } = useContributions(filters);
  const { data: workers } = useWorkers();
  const { data: lanes } = useLanes();
  const createContribution = useCreateContribution();
  const updateContribution = useUpdateContribution();
  const deleteContribution = useDeleteContribution();

  const handleOpenDialog = (contribution?: ContributionWithDetails) => {
    if (contribution) {
      setEditingContribution(contribution);
      setFormData({
        worker_id: contribution.worker_id,
        lane_id: contribution.lane_id,
        starts_at: contribution.starts_at.slice(0, 16), // Format for datetime-local
        ends_at: contribution.ends_at.slice(0, 16),
        available_seconds: contribution.available_seconds,
        travel_factor: contribution.travel_factor,
        performance_factor: contribution.performance_factor,
      });
    } else {
      setEditingContribution(null);
      setFormData({
        worker_id: '',
        lane_id: '',
        starts_at: '',
        ends_at: '',
        available_seconds: 28800,
        travel_factor: 1.0,
        performance_factor: 1.0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContribution(null);
  };

  const handleSubmit = async () => {
    if (!formData.worker_id || !formData.lane_id || !formData.starts_at || !formData.ends_at) {
      toast.error('Please fill in all required fields');
      return;
    }

    const contributionData = {
      ...formData,
      starts_at: new Date(formData.starts_at).toISOString(),
      ends_at: new Date(formData.ends_at).toISOString(),
    };

    if (editingContribution) {
      await updateContribution.mutateAsync({
        id: editingContribution.id,
        ...contributionData,
      });
    } else {
      await createContribution.mutateAsync(contributionData);
    }

    handleCloseDialog();
  };

  const handleDelete = async () => {
    if (deletingContributionId) {
      await deleteContribution.mutateAsync(deletingContributionId);
      setIsDeleteDialogOpen(false);
      setDeletingContributionId(null);
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingContributionId(id);
    setIsDeleteDialogOpen(true);
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Worker Shifts</h1>
          <p className="text-muted-foreground">
            Manage worker schedules and capacity contributions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shift
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filter-worker">Worker</Label>
              <Select
                value={filters.workerId || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, workerId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="filter-worker">
                  <SelectValue placeholder="All workers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All workers</SelectItem>
                  {workers?.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.first_name} {worker.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-lane">Lane</Label>
              <Select
                value={filters.laneId || 'all'}
                onValueChange={(value) =>
                  setFilters({ ...filters, laneId: value === 'all' ? undefined : value })
                }
              >
                <SelectTrigger id="filter-lane">
                  <SelectValue placeholder="All lanes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lanes</SelectItem>
                  {lanes?.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-start">Start Date</Label>
              <Input
                id="filter-start"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="filter-end">End Date</Label>
              <Input
                id="filter-end"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Lane</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Factors</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No shifts found
                </TableCell>
              </TableRow>
            ) : (
              contributions?.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell className="font-medium">
                    {contribution.worker.first_name} {contribution.worker.last_name}
                  </TableCell>
                  <TableCell>{contribution.lane.name}</TableCell>
                  <TableCell>{formatDateTime(contribution.starts_at)}</TableCell>
                  <TableCell>{formatDateTime(contribution.ends_at)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {formatDuration(contribution.available_seconds)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Perf: {contribution.performance_factor}x
                      </span>
                      <span className="text-muted-foreground">
                        Travel: {contribution.travel_factor}x
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(contribution)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDeleteDialog(contribution.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingContribution ? 'Edit Shift' : 'Add Shift'}
            </DialogTitle>
            <DialogDescription>
              {editingContribution
                ? 'Update the shift details below.'
                : 'Create a new worker shift and define their capacity contribution.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="worker">Worker *</Label>
                <Select
                  value={formData.worker_id}
                  onValueChange={(value) => setFormData({ ...formData, worker_id: value })}
                >
                  <SelectTrigger id="worker">
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers?.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.first_name} {worker.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lane">Lane *</Label>
                <Select
                  value={formData.lane_id}
                  onValueChange={(value) => setFormData({ ...formData, lane_id: value })}
                >
                  <SelectTrigger id="lane">
                    <SelectValue placeholder="Select lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {lanes?.map((lane) => (
                      <SelectItem key={lane.id} value={lane.id}>
                        {lane.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Start Time *</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends_at">End Time *</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_seconds">
                Available Capacity (seconds) *
              </Label>
              <Input
                id="available_seconds"
                type="number"
                min="0"
                step="900"
                value={formData.available_seconds}
                onChange={(e) =>
                  setFormData({ ...formData, available_seconds: parseInt(e.target.value) || 0 })
                }
              />
              <p className="text-sm text-muted-foreground">
                Current: {formatDuration(formData.available_seconds)} (3600 = 1 hour)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="performance_factor">
                  Performance Factor (0.0 - 2.0)
                </Label>
                <Input
                  id="performance_factor"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.performance_factor}
                  onChange={(e) =>
                    setFormData({ ...formData, performance_factor: parseFloat(e.target.value) || 1.0 })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  1.0 = normal, &gt;1.0 = faster, &lt;1.0 = slower
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="travel_factor">Travel Factor (0.0 - 1.0)</Label>
                <Input
                  id="travel_factor"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.travel_factor}
                  onChange={(e) =>
                    setFormData({ ...formData, travel_factor: parseFloat(e.target.value) || 1.0 })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  1.0 = no travel time, 0.5 = 50% travel overhead
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingContribution ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this shift? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
