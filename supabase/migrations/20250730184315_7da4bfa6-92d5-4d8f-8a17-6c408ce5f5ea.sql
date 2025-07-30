
-- Inserir um usuário administrador no sistema
-- Primeiro, vamos criar o usuário na tabela de autenticação
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'admin@medpay.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"nome": "Administrador"}'::jsonb,
  'authenticated'
);

-- Inserir o perfil do administrador
INSERT INTO profiles (
  id,
  user_id,
  nome,
  email,
  role,
  telefone
) VALUES (
  gen_random_uuid(),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Administrador',
  'admin@medpay.com',
  'admin',
  null
);

-- Inserir identidade para o usuário
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  '{"sub": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "email": "admin@medpay.com"}'::jsonb,
  'email',
  now(),
  now(),
  now()
);
