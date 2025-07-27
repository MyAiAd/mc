import { createClient } from '@supabase/supabase-js';

const serviceRoleKey = '<YOUR_JWT_TOKEN>';
const client = createClient('http://127.0.0.1:54321', serviceRoleKey);

console.log('Checking users...');
const { data, error } = await client.from('users').select('*');
if (error) {
  console.error('Error:', error);
} else {
  console.log('Users:', data);
}

// Also check auth.users
const { data: authUsers, error: authError } = await client.auth.admin.listUsers();
if (authError) {
  console.error('Auth Error:', authError);
} else {
  console.log('Auth Users:', authUsers.users.map(u => ({ id: u.id, email: u.email })));
} 