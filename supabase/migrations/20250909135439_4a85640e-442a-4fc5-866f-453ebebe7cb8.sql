-- Corrigir o role do usuário admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@medpay.com';

-- Verificar se a função get_user_role existe, se não, criar
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = user_uuid;
$$;