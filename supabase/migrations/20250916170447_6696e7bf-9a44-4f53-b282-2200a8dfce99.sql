-- Inserir algumas empresas exemplo para teste
INSERT INTO public.empresas (nome, cnpj, email, telefone, endereco, status) VALUES
('Clínica São José', '12.345.678/0001-90', 'contato@clinicasaojose.com.br', '(11) 1234-5678', 'Rua das Flores, 123 - São Paulo/SP', 'ativa'),
('Centro Médico Vila Nova', '98.765.432/0001-10', 'atendimento@centromedicovn.com.br', '(11) 9876-5432', 'Av. Principal, 456 - São Paulo/SP', 'ativa'),
('Hospital Regional', '11.222.333/0001-44', 'info@hospitalregional.com.br', '(11) 5555-0000', 'Rua da Saúde, 789 - São Paulo/SP', 'ativa')
ON CONFLICT (cnpj) DO NOTHING;