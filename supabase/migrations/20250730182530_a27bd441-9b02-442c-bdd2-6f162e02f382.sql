-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'usuario', 'medico');
CREATE TYPE public.status_type AS ENUM ('ativa', 'inativa');
CREATE TYPE public.procedimento_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.pagamento_status AS ENUM ('pendente', 'pago', 'cancelado');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  role user_role NOT NULL DEFAULT 'usuario',
  empresa_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create empresas table
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  status status_type NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicos table
CREATE TABLE public.medicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  crm TEXT NOT NULL,
  especialidade TEXT,
  email TEXT,
  telefone TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  status status_type NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create procedimentos table
CREATE TABLE public.procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo TEXT,
  valor DECIMAL(10,2) NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id),
  categoria TEXT,
  status procedimento_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lancamentos table for procedure launches
CREATE TABLE public.lancamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  data_lancamento DATE NOT NULL,
  observacoes TEXT,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lancamento_itens table for procedure items
CREATE TABLE public.lancamento_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos(id) ON DELETE CASCADE,
  procedimento_id UUID NOT NULL REFERENCES public.procedimentos(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pagamentos table
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos(id),
  medico_id UUID NOT NULL REFERENCES public.medicos(id),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status pagamento_status NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create configuracoes table for system settings
CREATE TABLE public.configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'string',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configurations
INSERT INTO public.configuracoes (chave, valor, descricao, tipo) VALUES 
('session_timeout', '3600', 'Tempo limite da sessão em segundos (padrão: 1 hora)', 'integer'),
('auto_logout_warning', '300', 'Aviso de logout automático em segundos antes do timeout', 'integer'),
('currency_symbol', 'R$', 'Símbolo da moeda', 'string'),
('decimal_places', '2', 'Casas decimais para valores monetários', 'integer');

-- Add foreign key constraint for empresa_id in profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_empresa 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create security definer function to get user empresa
CREATE OR REPLACE FUNCTION public.get_user_empresa(user_uuid UUID)
RETURNS UUID AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for empresas
CREATE POLICY "Admins can manage empresas" ON public.empresas
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their empresa" ON public.empresas
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  id = public.get_user_empresa(auth.uid())
);

-- RLS Policies for medicos
CREATE POLICY "Admins can manage medicos" ON public.medicos
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view medicos from their empresa" ON public.medicos
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  empresa_id = public.get_user_empresa(auth.uid())
);

-- RLS Policies for procedimentos
CREATE POLICY "Admins can manage procedimentos" ON public.procedimentos
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view procedimentos from their empresa" ON public.procedimentos
FOR SELECT USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  empresa_id = public.get_user_empresa(auth.uid())
);

-- RLS Policies for lancamentos
CREATE POLICY "Users can manage their empresa lancamentos" ON public.lancamentos
FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  empresa_id = public.get_user_empresa(auth.uid())
);

-- RLS Policies for lancamento_itens
CREATE POLICY "Users can manage lancamento_itens" ON public.lancamento_itens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.lancamentos l 
    WHERE l.id = lancamento_itens.lancamento_id 
    AND (
      public.get_user_role(auth.uid()) = 'admin' OR 
      l.empresa_id = public.get_user_empresa(auth.uid())
    )
  )
);

-- RLS Policies for pagamentos
CREATE POLICY "Users can manage their empresa pagamentos" ON public.pagamentos
FOR ALL USING (
  public.get_user_role(auth.uid()) = 'admin' OR 
  empresa_id = public.get_user_empresa(auth.uid())
);

-- RLS Policies for configuracoes
CREATE POLICY "Admins can manage configuracoes" ON public.configuracoes
FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view configuracoes" ON public.configuracoes
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicos_updated_at BEFORE UPDATE ON public.medicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedimentos_updated_at BEFORE UPDATE ON public.procedimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lancamentos_updated_at BEFORE UPDATE ON public.lancamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON public.configuracoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update lancamento total when items change
CREATE OR REPLACE FUNCTION public.update_lancamento_total()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers to update lancamento total
CREATE TRIGGER update_lancamento_total_on_insert
AFTER INSERT ON public.lancamento_itens
FOR EACH ROW EXECUTE FUNCTION public.update_lancamento_total();

CREATE TRIGGER update_lancamento_total_on_update
AFTER UPDATE ON public.lancamento_itens
FOR EACH ROW EXECUTE FUNCTION public.update_lancamento_total();

CREATE TRIGGER update_lancamento_total_on_delete
AFTER DELETE ON public.lancamento_itens
FOR EACH ROW EXECUTE FUNCTION public.update_lancamento_total();