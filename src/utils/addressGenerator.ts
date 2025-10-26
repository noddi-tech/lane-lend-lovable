import { supabase } from '@/integrations/supabase/client';

const osloStreets = [
  'Karl Johans gate', 'Storgata', 'Grensen', 'Bogstadveien', 'Trondheimsveien',
  'Østre Aker vei', 'Pilestredet', 'Thorvald Meyers gate', 'Markveien', 'Grünerløkka',
  'Sofienberggata', 'Finnmarksgata', 'Helgesens gate', 'Waldemar Thranes gate', 'Sandakerveien',
  'Colletts gate', 'Thereses gate', 'Ullevålsveien', 'Kirkeveien', 'Frognerveien',
  'Thomas Heftyes gate', 'Skovveien', 'Bygdøy allé', 'Drammensveien', 'Kristian Augusts gate',
  'Akersgata', 'Tollbugata', 'Møllergata', 'Youngstorget', 'Torggata',
  'Hausmanns gate', 'Brenneriveien', 'Schweigaards gate', 'Strømsveien', 'Enerhauggata'
];

export interface GeneratedAddress {
  id: string;
  user_id: string;
  street_address: string;
  postal_code: string;
  city: string;
  country: string;
}

function generateOsloPostalCode(): string {
  // Oslo postal codes range from 0001 to 0999
  const code = Math.floor(Math.random() * 999) + 1;
  return code.toString().padStart(4, '0');
}

function generateStreetAddress(): string {
  const street = osloStreets[Math.floor(Math.random() * osloStreets.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  const hasLetter = Math.random() > 0.7;
  const letter = hasLetter ? String.fromCharCode(65 + Math.floor(Math.random() * 3)) : ''; // A, B, or C
  return `${street} ${number}${letter}`;
}

export async function generateAddresses(userIds: string[]): Promise<GeneratedAddress[]> {
  const addresses: GeneratedAddress[] = [];

  for (const userId of userIds) {
    addresses.push({
      id: crypto.randomUUID(),
      user_id: userId,
      street_address: generateStreetAddress(),
      postal_code: generateOsloPostalCode(),
      city: 'Oslo',
      country: 'NO',
    });
  }

  return addresses;
}

export async function createAddressesInDatabase(addresses: GeneratedAddress[]): Promise<number> {
  const { error } = await supabase
    .from('addresses')
    .insert(addresses.map(a => ({
      id: a.id,
      user_id: a.user_id,
      street_address: a.street_address,
      postal_code: a.postal_code,
      city: a.city,
      country: a.country,
    })));

  if (error) throw error;

  return addresses.length;
}
