import { useState } from 'react';
import { useWorkers, useCreateWorker, useUpdateWorker, useDeleteWorker, type Worker } from '@/hooks/admin/useWorkers';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';

export default function Workers() {
  const { data: workers, isLoading } = useWorkers();
  const createWorker = useCreateWorker();
  const updateWorker = useUpdateWorker();
  const deleteWorker = useDeleteWorker();

  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorkerId, setDeletingWorkerId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<Partial<Worker>>({
    defaultValues: { active: true },
  });

  const isActive = watch('active');

  const onSubmit = async (data: Partial<Worker>) => {
    if (editingWorker) {
      await updateWorker.mutateAsync({ ...data, id: editingWorker.id });
    } else {
      await createWorker.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingWorker(null);
    reset({ active: true });
  };

  const handleEdit = (worker: Worker) => {
    setEditingWorker(worker);
    reset(worker);
    setIsDialogOpen(true);
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers?.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">
                    {worker.first_name} {worker.last_name}
                  </TableCell>
                  <TableCell>{worker.email || '-'}</TableCell>
                  <TableCell>{worker.phone || '-'}</TableCell>
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
