// Temporary fix - will be merged properly
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CustomerSeedData from './CustomerSeedData';

export default function SeedData() {
  const [isSeeding, setIsSeeding] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Seed Test Data</h1>

      <Tabs defaultValue="base" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Data</TabsTrigger>
          <TabsTrigger value="customers">Customer & Bookings</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="base">
          <Card className="p-6">
            <p>Base seed functionality (original SeedData content goes here)</p>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <CustomerSeedData />
        </TabsContent>

        <TabsContent value="bulk">
          <Card className="p-6">
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm('Clear all customers?')) {
                  await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                  toast.success('Cleared');
                }
              }}
            >
              Clear All Customers
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
