-- Limpar todas as tabelas exceto usuários (manter apenas admin)
-- Deletar registros de tabelas filhas primeiro (ordem de dependência)
DELETE FROM public.lancamento_itens;
DELETE FROM public.lancamentos;
DELETE FROM public.pagamentos;
DELETE FROM public.procedimentos;
DELETE FROM public.medicos;
DELETE FROM public.user_empresas;
DELETE FROM public.empresas;
DELETE FROM public.configuracoes;

-- Manter apenas o usuário admin na tabela profiles
DELETE FROM public.profiles WHERE email != 'admin@medpay.com';