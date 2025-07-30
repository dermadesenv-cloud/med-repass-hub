-- Fix security warnings by setting proper search_path for functions

-- Update get_user_role function with secure search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Update get_user_empresa function with secure search_path
CREATE OR REPLACE FUNCTION public.get_user_empresa(user_uuid UUID)
RETURNS UUID 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Update handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'usuario'
  );
  RETURN NEW;
END;
$$;

-- Update update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update update_lancamento_total function with secure search_path
CREATE OR REPLACE FUNCTION public.update_lancamento_total()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.lancamentos 
  SET valor_total = (
    SELECT COALESCE(SUM(valor_total), 0) 
    FROM public.lancamento_itens 
    WHERE lancamento_id = COALESCE(NEW.lancamento_id, OLD.lancamento_id)
  )
  WHERE id = COALESCE(NEW.lancamento_id, OLD.lancamento_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;