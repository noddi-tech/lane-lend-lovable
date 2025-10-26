import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import {
  useCapabilities,
  useCreateCapability,
  useUpdateCapability,
  useDeleteCapability,
  type CapabilityWithSkills,
} from '@/hooks/admin/useCapabilities';
import { useSkills } from '@/hooks/admin/useSkills';

export default function Capabilities() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCapability, setEditingCapability] = useState<CapabilityWithSkills | null>(null);
  const [deletingCapabilityId, setDeletingCapabilityId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    skillIds: [] as string[] 
  });

  const { data: capabilities, isLoading: capabilitiesLoading } = useCapabilities();
  const { data: skills, isLoading: skillsLoading } = useSkills();
  const createCapability = useCreateCapability();
  const updateCapability = useUpdateCapability();
  const deleteCapability = useDeleteCapability();

  const filteredCapabilities = capabilities?.filter((cap) =>
    cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cap.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (capability?: CapabilityWithSkills) => {
    if (capability) {
      setEditingCapability(capability);
      setFormData({
        name: capability.name,
        description: capability.description || '',
        skillIds: capability.skills.map(s => s.id),
      });
    } else {
      setEditingCapability(null);
      setFormData({ name: '', description: '', skillIds: [] });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCapability(null);
    setFormData({ name: '', description: '', skillIds: [] });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingCapability) {
      await updateCapability.mutateAsync({
        id: editingCapability.id,
        capability: {
          name: formData.name,
          description: formData.description || null,
        },
        skillIds: formData.skillIds,
      });
    } else {
      await createCapability.mutateAsync({
        capability: {
          name: formData.name,
          description: formData.description || null,
        },
        skillIds: formData.skillIds,
      });
    }

    handleCloseDialog();
  };

  const handleDelete = async () => {
    if (deletingCapabilityId) {
      await deleteCapability.mutateAsync(deletingCapabilityId);
      setIsDeleteDialogOpen(false);
      setDeletingCapabilityId(null);
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingCapabilityId(id);
    setIsDeleteDialogOpen(true);
  };

  const toggleSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  if (capabilitiesLoading || skillsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capabilities</h1>
          <p className="text-muted-foreground">
            Manage service capabilities and required skills
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Capability
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Required Skills</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCapabilities?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No capabilities found
                </TableCell>
              </TableRow>
            ) : (
              filteredCapabilities?.map((capability) => (
                <TableRow key={capability.id}>
                  <TableCell className="font-medium">{capability.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {capability.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {capability.skills.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No skills</span>
                      ) : (
                        capability.skills.map((skill) => (
                          <Badge key={skill.id} variant="secondary">
                            {skill.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(capability)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDeleteDialog(capability.id)}
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
              {editingCapability ? 'Edit Capability' : 'Add Capability'}
            </DialogTitle>
            <DialogDescription>
              {editingCapability
                ? 'Update the capability information and required skills.'
                : 'Create a new capability and assign required skills.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basic Service"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this capability..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Required Skills</Label>
              <div className="rounded-lg border p-4 space-y-3 max-h-64 overflow-y-auto">
                {skills?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No skills available. Create skills first.
                  </p>
                ) : (
                  skills?.map((skill) => (
                    <div key={skill.id} className="flex items-start gap-3">
                      <Checkbox
                        id={skill.id}
                        checked={formData.skillIds.includes(skill.id)}
                        onCheckedChange={() => toggleSkill(skill.id)}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={skill.id}
                          className="font-medium cursor-pointer"
                        >
                          {skill.name}
                        </Label>
                        {skill.description && (
                          <p className="text-sm text-muted-foreground">
                            {skill.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {editingCapability ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Capability</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this capability? This action cannot be undone.
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
