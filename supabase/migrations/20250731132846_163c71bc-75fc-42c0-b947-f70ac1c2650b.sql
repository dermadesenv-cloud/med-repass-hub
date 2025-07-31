
-- Fase 1: Correção da Base de Dados
-- Confirmar email do admin e criar perfil se necessário

-- Primeiro, vamos confirmar qualquer usuário admin existente
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'admin@medpay.com' 
AND email_confirmed_at IS NULL;

-- Fase 2: Correção das Políticas RLS
-- Remover políticas problemáticas que podem causar recursão
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Criar função segura para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = $1 AND role = 'admin'
  );
$$;

-- Criar função para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role::TEXT, 'usuario') FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Recriar políticas RLS mais seguras
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Política especial para permitir inserção de perfis
CREATE POLICY "Allow profile creation for new users" 
ON public.profiles FOR INSERT 
WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Criar ou atualizar perfil admin diretamente
INSERT INTO public.profiles (user_id, nome, email, role)
SELECT id, 'Administrador', 'admin@medpay.com', 'admin'
FROM auth.users 
WHERE email = 'admin@medpay.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  nome = 'Administrador',
  email = 'admin@medpay.com',
  role = 'admin',
  updated_at = now();

-- Melhorar a função handle_new_user para ser mais robusta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.email = 'admin@medpay.com' THEN 'admin'
      ELSE 'usuario'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recriar o trigger se não existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
