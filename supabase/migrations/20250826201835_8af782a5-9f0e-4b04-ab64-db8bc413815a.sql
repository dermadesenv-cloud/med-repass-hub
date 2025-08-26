
-- Criar tabela para relacionamento usuário-empresa (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

-- Migrar vínculos existentes da tabela profiles para user_empresas
INSERT INTO public.user_empresas (user_id, empresa_id)
SELECT user_id, empresa_id 
FROM public.profiles 
WHERE empresa_id IS NOT NULL
ON CONFLICT (user_id, empresa_id) DO NOTHING;

-- Função para obter empresas permitidas para um usuário
CREATE OR REPLACE FUNCTION public.get_user_empresas(user_uuid uuid)
RETURNS UUID[] AS $$
BEGIN
  -- Se for admin, retorna array vazio (pode acessar tudo)
  IF get_user_role(user_uuid) = 'admin' THEN
    RETURN ARRAY[]::UUID[];
  END IF;
  
  -- Retorna array das empresas que o usuário pode acessar
  RETURN ARRAY(
    SELECT empresa_id 
    FROM public.user_empresas 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Habilitar RLS na nova tabela
ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_empresas
CREATE POLICY "Admins can manage user_empresas" 
  ON public.user_empresas 
  FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their own empresa assignments" 
  ON public.user_empresas 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Atualizar políticas RLS existentes para usar multiempresas

-- Política para lancamentos
DROP POLICY IF EXISTS "Users can manage their empresa lancamentos" ON public.lancamentos;
CREATE POLICY "Users can manage their empresa lancamentos" 
  ON public.lancamentos 
  FOR ALL 
  USING (
    get_user_role(auth.uid()) = 'admin' OR 
    empresa_id = ANY(get_user_empresas(auth.uid()))
  );

-- Política para medicos
DROP POLICY IF EXISTS "Users can view medicos from their empresa" ON public.medicos;
CREATE POLICY "Users can view medicos from their empresa" 
  ON public.medicos 
  FOR SELECT 
  USING (
    get_user_role(auth.uid()) = 'admin' OR 
    empresa_id = ANY(get_user_empresas(auth.uid()))
  );

-- Política para procedimentos
DROP POLICY IF EXISTS "Users can view procedimentos from their empresa" ON public.procedimentos;
CREATE POLICY "Users can view procedimentos from their empresa" 
  ON public.procedimentos 
  FOR SELECT 
  USING (
    get_user_role(auth.uid()) = 'admin' OR 
    empresa_id = ANY(get_user_empresas(auth.uid()))
  );

-- Política para pagamentos
DROP POLICY IF EXISTS "Users can manage their empresa pagamentos" ON public.pagamentos;
CREATE POLICY "Users can manage their empresa pagamentos" 
  ON public.pagamentos 
  FOR ALL 
  USING (
    get_user_role(auth.uid()) = 'admin' OR 
    empresa_id = ANY(get_user_empresas(auth.uid()))
  );

-- Política para empresas (usuários só veem suas empresas)
DROP POLICY IF EXISTS "Users can view their empresa" ON public.empresas;
CREATE POLICY "Users can view their empresas" 
  ON public.empresas 
  FOR SELECT 
  USING (
    get_user_role(auth.uid()) = 'admin' OR 
    id = ANY(get_user_empresas(auth.uid()))
  );
