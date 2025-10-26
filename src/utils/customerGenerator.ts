import { supabase } from '@/integrations/supabase/client';

const norwegianFirstNames = [
  'Emma', 'Noah', 'Olivia', 'William', 'Ella', 'Lucas', 'Nora', 'Filip', 'Sofie', 'Jakob',
  'Leah', 'Emil', 'Ingrid', 'Oliver', 'Sara', 'Henrik', 'Maja', 'Aksel', 'Thea', 'Kasper',
  'Ada', 'Isak', 'Ida', 'Magnus', 'Emilie', 'Tobias', 'Frida', 'Sander', 'Anna', 'Jonas',
  'Marie', 'Martin', 'Victoria', 'Andreas', 'Mia', 'Alexander', 'Linnea', 'Benjamin', 'Sophie', 'Daniel',
  'Julie', 'Christian', 'Amalie', 'Mathias', 'Vilde', 'Sebastian', 'Hedda', 'Markus', 'Oda', 'Erik'
];

const norwegianLastNames = [
  'Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen',
  'Jensen', 'Karlsen', 'Johnsen', 'Pettersen', 'Eriksen', 'Berg', 'Haugen', 'Hagen',
  'Johannessen', 'Andreassen', 'Jacobsen', 'Solberg', 'Halvorsen', 'Sørensen', 'Martinsen', 'Eide',
  'Bakken', 'Strand', 'Iversen', 'Moen', 'Lie', 'Kristoffersen', 'Nguyen', 'Lund',
  'Berge', 'Christensen', 'Mikkelsen', 'Dahl', 'Aas', 'Knudsen', 'Amundsen', 'Henriksen'
];

export interface GeneratedCustomer {
  id: string;
  email: string;
  full_name: string;
  phone: string;
}

function generateNorwegianPhone(): string {
  const prefix = ['4', '9'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomDigits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('');
  return `+47 ${randomPrefix}${randomDigits.slice(0, 3)} ${randomDigits.slice(3)}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const suffix = index > 0 ? index : '';
  return `${cleanFirst}.${cleanLast}${suffix}@example.com`;
}

export async function generateCustomers(count: number): Promise<GeneratedCustomer[]> {
  const customers: GeneratedCustomer[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const firstName = norwegianFirstNames[Math.floor(Math.random() * norwegianFirstNames.length)];
    const lastName = norwegianLastNames[Math.floor(Math.random() * norwegianLastNames.length)];
    
    let email = generateEmail(firstName, lastName, 0);
    let emailIndex = 1;
    while (usedEmails.has(email)) {
      email = generateEmail(firstName, lastName, emailIndex);
      emailIndex++;
    }
    usedEmails.add(email);

    const full_name = `${firstName} ${lastName}`;
    const phone = generateNorwegianPhone();

    customers.push({
      id: crypto.randomUUID(),
      email,
      full_name,
      phone,
    });
  }

  return customers;
}

export async function createCustomersInDatabase(customers: GeneratedCustomer[]): Promise<{
  profiles: number;
  roles: number;
}> {
  // Insert profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .insert(customers.map(c => ({
      id: c.id,
      email: c.email,
      full_name: c.full_name,
      phone: c.phone,
    })));

  if (profileError) throw profileError;

  // Insert user roles
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert(customers.map(c => ({
      user_id: c.id,
      role: 'customer' as const,
    })));

  if (roleError) throw roleError;

  return {
    profiles: customers.length,
    roles: customers.length,
  };
}
