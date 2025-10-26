import { useState } from 'react';
import { 
  useWorkers, 
  useCreateWorker, 
  useUpdateWorker, 
  useDeleteWorker,
  useAssignSkillToWorker,
  useRemoveSkillFromWorker,
  type WorkerWithSkills 
} from '@/hooks/admin/useWorkers';
import { useSkills } from '@/hooks/admin/useSkills';
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
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Users, Award, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function Workers() {
  const { data: workers, isLoading } = useWorkers();
  const { data: allSkills } = useSkills();
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();
  const assignSkill = useAssignSkillToWorker();
  const removeSkill = useRemoveSkillFromWorker();

  const [editingWorker, setEditingWorker] = useState<WorkerWithSkills | null>(null);
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<WorkerWithSkills>>({
    defaultValues: { active: true },
  });

  const isActive = watch('active');

  const onSubmit = async (data: Partial<WorkerWithSkills>) => {
    if (editingWorker) {
      await updateWorker.mutateAsync({ ...data, id: editingWorker.id });
    } else {
      await createWorker.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingWorker(null);
    reset({ active: true });
  };

  const handleEdit = (worker: WorkerWithSkills) => {
    setEditingWorker(worker);
    reset(worker);
    setIsDialogOpen(true);
  };

  const handleAssignSkill = async (workerId: string) => {
    if (!selectedSkillId) return;
    await assignSkill.mutateAsync({ workerId, skillId: selectedSkillId });
    setSelectedSkillId('');
  };

  const handleRemoveSkill = async (workerId: string, skillId: string) => {
    await removeSkill.mutateAsync({ workerId, skillId });
  };

  const getAvailableSkills = (worker: WorkerWithSkills) => {
    const workerSkillIds = worker.skills.map(s => s.id);
    return allSkills?.filter(skill => !workerSkillIds.includes(skill.id)) || [];
  };

  const handleDelete = async () => {
    if (deletingWorkerId) {
      await deleteWorker.mutateAsync(deletingWorkerId);
      setDeletingWorkerId(null);
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
          <h1 className="text-3xl font-bold text-foreground">Workers Management</h1>
          <p className="text-muted-foreground mt-1">Manage service workers and their availability</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingWorker(null); reset({ active: true }); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingWorker ? 'Edit Worker' : 'Create New Worker'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...register('first_name', { required: true })} placeholder="John" />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...register('last_name', { required: true })} placeholder="Doe" />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="john.doe@example.com" />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register('phone')} placeholder="+47 123 45 678" />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('active', checked)}
                />
                <Label htmlFor="active" className="cursor-pointer">Active Worker</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWorker.isPending || updateWorker.isPending}>
                  {editingWorker ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Service Workers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers?.map((worker) => (
                <Collapsible
                  key={worker.id}
                  open={expandedWorkerId === worker.id}
                  onOpenChange={(open) => setExpandedWorkerId(open ? worker.id : null)}
                  asChild
                >
                  <>
                    <TableRow>
                      <TableCell className="font-medium">
                        {worker.first_name} {worker.last_name}
                      </TableCell>
                      <TableCell>{worker.email || '-'}</TableCell>
                      <TableCell>{worker.phone || '-'}</TableCell>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {worker.skills.length} skill{worker.skills.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell>
                        {worker.active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(worker)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingWorkerId(worker.id)}
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
                              <h4 className="text-sm font-medium mb-3">Assigned Skills</h4>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {worker.skills.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No skills assigned yet</p>
                                ) : (
                                  worker.skills.map((skill) => (
                                    <Badge key={skill.id} variant="secondary" className="gap-1">
                                      {skill.name}
                                      <button
                                        onClick={() => handleRemoveSkill(worker.id, skill.id)}
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
                              <h4 className="text-sm font-medium mb-3">Add Skill</h4>
                              <div className="flex gap-2 max-w-md">
                                <Select 
                                  value={selectedSkillId} 
                                  onValueChange={setSelectedSkillId}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a skill to add" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableSkills(worker).length === 0 ? (
                                      <div className="p-2 text-sm text-muted-foreground">
                                        All skills assigned
                                      </div>
                                    ) : (
                                      getAvailableSkills(worker).map((skill) => (
                                        <SelectItem key={skill.id} value={skill.id}>
                                          {skill.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => handleAssignSkill(worker.id)}
                                  disabled={!selectedSkillId}
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

          {!workers?.length && (
            <div className="text-center py-8 text-muted-foreground">
              No workers created yet. Click "Add Worker" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingWorkerId} onOpenChange={() => setDeletingWorkerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this worker? This action cannot be undone.
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
