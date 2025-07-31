
-- Primeiro, vamos criar as tabelas que estão faltando e ajustar as existentes

-- Adicionar foreign keys que estavam faltando
ALTER TABLE public.procedimentos 
ADD CONSTRAINT fk_procedimentos_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.medicos 
ADD CONSTRAINT fk_medicos_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.lancamentos 
ADD CONSTRAINT fk_lancamentos_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.lancamentos 
ADD CONSTRAINT fk_lancamentos_medico 
FOREIGN KEY (medico_id) REFERENCES public.medicos(id);

ALTER TABLE public.lancamentos 
ADD CONSTRAINT fk_lancamentos_created_by 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.lancamento_itens 
ADD CONSTRAINT fk_lancamento_itens_lancamento 
FOREIGN KEY (lancamento_id) REFERENCES public.lancamentos(id);

ALTER TABLE public.lancamento_itens 
ADD CONSTRAINT fk_lancamento_itens_procedimento 
FOREIGN KEY (procedimento_id) REFERENCES public.procedimentos(id);

ALTER TABLE public.pagamentos 
ADD CONSTRAINT fk_pagamentos_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.pagamentos 
ADD CONSTRAINT fk_pagamentos_medico 
FOREIGN KEY (medico_id) REFERENCES public.medicos(id);

ALTER TABLE public.pagamentos 
ADD CONSTRAINT fk_pagamentos_lancamento 
FOREIGN KEY (lancamento_id) REFERENCES public.lancamentos(id);

-- Criar trigger para atualizar valor_total nos lançamentos
CREATE OR REPLACE FUNCTION update_lancamento_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lancamentos 
    SET valor_total = (
        SELECT COALESCE(SUM(valor_total), 0) 
        FROM lancamento_itens 
        WHERE lancamento_id = COALESCE(NEW.lancamento_id, OLD.lancamento_id)
    )
    WHERE id = COALESCE(NEW.lancamento_id, OLD.lancamento_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lancamento_total
    AFTER INSERT OR UPDATE OR DELETE ON lancamento_itens
    FOR EACH ROW EXECUTE FUNCTION update_lancamento_total();

-- Criar função para verificar se usuário pode ver dados de uma empresa
CREATE OR REPLACE FUNCTION can_access_empresa(empresa_uuid uuid)
RETURNS boolean AS $$
BEGIN
    -- Admin pode ver tudo
    IF get_user_role(auth.uid()) = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Usuário pode ver apenas sua empresa
    RETURN empresa_uuid = get_user_empresa(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Atualizar políticas RLS para lancamento_itens
DROP POLICY IF EXISTS "Users can manage lancamento_itens" ON public.lancamento_itens;

CREATE POLICY "Users can manage lancamento_itens" ON public.lancamento_itens
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lancamentos l 
        WHERE l.id = lancamento_id 
        AND can_access_empresa(l.empresa_id)
    )
);
