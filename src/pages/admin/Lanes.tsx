import { useState } from 'react';
import { 
  useLanes, 
  useCreateLane, 
  useUpdateLane, 
  useDeleteLane,
  type LaneWithCapabilities 
} from '@/hooks/admin/useLanes';
import { useDrivingGates } from '@/hooks/admin/useDrivingGates';
import { useCapabilities } from '@/hooks/admin/useCapabilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Clock, Zap, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Lanes() {
  const { data: lanes, isLoading } = useLanes();
  const { data: allCapabilities } = useCapabilities();
  const createLane = useCreateLane();
  const updateLane = useUpdateLane();
  const deleteLane = useDeleteLane();
  const assignCapability = useAssignCapabilityToLane();
  const removeCapability = useRemoveCapabilityFromLane();

  const [editingLane, setEditingLane] = useState<LaneWithCapabilities | null>(null);
  const [deletingLaneId, setDeletingLaneId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedLaneId, setExpandedLaneId] = useState<string | null>(null);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>('');

  const { register, handleSubmit, reset } = useForm<Partial<LaneWithCapabilities>>();

  const onSubmit = async (data: Partial<LaneWithCapabilities>) => {
    if (editingLane) {
      await updateLane.mutateAsync({ ...data, id: editingLane.id });
    } else {
      await createLane.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingLane(null);
    reset();
  };

  const handleEdit = (lane: LaneWithCapabilities) => {
    setEditingLane(lane);
    reset(lane);
    setIsDialogOpen(true);
  };

  const handleAssignCapability = async (laneId: string) => {
    if (!selectedCapabilityId) return;
    await assignCapability.mutateAsync({ laneId, capabilityId: selectedCapabilityId });
    setSelectedCapabilityId('');
  };

  const handleRemoveCapability = async (laneId: string, capabilityId: string) => {
    await removeCapability.mutateAsync({ laneId, capabilityId });
  };

  const getAvailableCapabilities = (lane: LaneWithCapabilities) => {
    const laneCapabilityIds = lane.capabilities.map(c => c.id);
    return allCapabilities?.filter(cap => !laneCapabilityIds.includes(cap.id)) || [];
  };

  const handleDelete = async () => {
    if (deletingLaneId) {
      await deleteLane.mutateAsync(deletingLaneId);
      setDeletingLaneId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lanes Management</h1>
          <p className="text-muted-foreground mt-1">Manage service lanes and their operating hours</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLane(null); reset({}); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Lane
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLane ? 'Edit Lane' : 'Create New Lane'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Lane Name</Label>
                <Input id="name" {...register('name', { required: true })} placeholder="e.g., Express Lane 1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="open_time">Open Time</Label>
                  <Input id="open_time" type="time" {...register('open_time', { required: true })} />
                </div>
                <div>
                  <Label htmlFor="close_time">Close Time</Label>
                  <Input id="close_time" type="time" {...register('close_time', { required: true })} />
                </div>
              </div>

              <div>
                <Label htmlFor="time_zone">Time Zone</Label>
                <Input id="time_zone" {...register('time_zone')} placeholder="e.g., Europe/Oslo" defaultValue="Europe/Oslo" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createLane.isPending || updateLane.isPending}>
                  {editingLane ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Lanes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Operating Hours</TableHead>
                <TableHead>Time Zone</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lanes?.map((lane) => (
                <Collapsible
                  key={lane.id}
                  open={expandedLaneId === lane.id}
                  onOpenChange={(open) => setExpandedLaneId(open ? lane.id : null)}
                  asChild
                >
                  <>
                    <TableRow>
                      <TableCell className="font-medium">{lane.name}</TableCell>
                      <TableCell>
                        {lane.open_time} - {lane.close_time}
                      </TableCell>
                      <TableCell>{lane.time_zone}</TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {lane.capabilities.length} capabilit{lane.capabilities.length !== 1 ? 'ies' : 'y'}
                              </span>
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        {lane.closed_for_new_bookings_at ? (
                          <Badge variant="destructive">Closed</Badge>
                        ) : (
                          <Badge variant="default">Open</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(lane)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingLaneId(lane.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50">
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-3">Assigned Capabilities</h4>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {lane.capabilities.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No capabilities assigned yet</p>
                                ) : (
                                  lane.capabilities.map((capability) => (
                                    <Badge key={capability.id} variant="secondary" className="gap-1">
                                      {capability.name}
                                      <button
                                        onClick={() => handleRemoveCapability(lane.id, capability.id)}
                                        className="ml-1 hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-3">Add Capability</h4>
                              <div className="flex gap-2 max-w-md">
                                <Select 
                                  value={selectedCapabilityId} 
                                  onValueChange={setSelectedCapabilityId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a capability to add" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableCapabilities(lane).length === 0 ? (
                                      <div className="p-2 text-sm text-muted-foreground">
                                        All capabilities assigned
                                      </div>
                                    ) : (
                                      getAvailableCapabilities(lane).map((capability) => (
                                        <SelectItem key={capability.id} value={capability.id}>
                                          {capability.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => handleAssignCapability(lane.id)}
                                  disabled={!selectedCapabilityId}
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>

          {!lanes?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No lanes created yet. Click "Add Lane" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingLaneId} onOpenChange={() => setDeletingLaneId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lane</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lane? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
