import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Capability {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface CapabilityWithSkills extends Capability {
  skills: Array<{ id: string; name: string }>;
}

export const useCapabilities = () => {
  return useQuery({
    queryKey: ['capabilities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capabilities')
        .select(`
          *,
          capability_skills(
            skill_id,
            skills(id, name)
          )
        `)
        .order('name');
      
      if (error) throw error;
      
      return data.map(cap => ({
        ...cap,
        skills: cap.capability_skills?.map((cs: any) => cs.skills).filter(Boolean) || [],
      })) as CapabilityWithSkills[];
    },
  });
};

export const useCreateCapability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      capability, 
      skillIds 
    }: { 
      capability: Omit<Capability, 'id' | 'created_at'>; 
      skillIds: string[] 
    }) => {
      const { data: capData, error: capError } = await supabase
        .from('capabilities')
        .insert(capability)
        .select()
        .single();
      
      if (capError) throw capError;
      
      if (skillIds.length > 0) {
        const { error: skillsError } = await supabase
          .from('capability_skills')
          .insert(
            skillIds.map(skillId => ({
              capability_id: capData.id,
              skill_id: skillId,
            }))
          );
        
        if (skillsError) throw skillsError;
      }
      
      return capData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] });
      toast({ title: 'Success', description: 'Capability created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateCapability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      capability, 
      skillIds 
    }: { 
      id: string; 
      capability: Partial<Omit<Capability, 'id' | 'created_at'>>; 
      skillIds?: string[] 
    }) => {
      const { data, error } = await supabase
        .from('capabilities')
        .update(capability)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (skillIds !== undefined) {
        // Remove old skill links
        const { error: deleteError } = await supabase
          .from('capability_skills')
          .delete()
          .eq('capability_id', id);
        
        if (deleteError) throw deleteError;
        
        // Add new skill links
        if (skillIds.length > 0) {
          const { error: insertError } = await supabase
            .from('capability_skills')
            .insert(
              skillIds.map(skillId => ({
                capability_id: id,
                skill_id: skillId,
              }))
            );
          
          if (insertError) throw insertError;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] });
      toast({ title: 'Success', description: 'Capability updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteCapability = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capabilities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capabilities'] });
      toast({ title: 'Success', description: 'Capability deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
};
