
-- First, let's create the admin user directly in the auth.users table
-- This will create the user with a known password that can be used for login
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@medpay.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('admin123', gen_salt('bf')),
  updated_at = now();

-- Now create/update the profile for the admin user
INSERT INTO public.profiles (
  id,
  user_id,
  nome,
  email,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Administrador',
  'admin@medpay.com',
  'admin',
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  nome = 'Administrador',
  email = 'admin@medpay.com',
  role = 'admin',
  updated_at = now();
