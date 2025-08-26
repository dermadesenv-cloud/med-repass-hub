
import { useAuth } from '@/context/AuthContext';

export const useAllowedEmpresas = () => {
  const { isAdmin, allowedEmpresas, userEmpresas } = useAuth();

  const canAccessEmpresa = (empresaId: string) => {
    if (isAdmin) return true;
    return allowedEmpresas.includes(empresaId);
  };

  const getEmpresaName = (empresaId: string) => {
    if (isAdmin) return null;
    const userEmpresa = userEmpresas.find(ue => ue.empresa_id === empresaId);
    return userEmpresa?.empresas?.nome || 'Empresa não encontrada';
  };

  return {
    canAccessEmpresa,
    getEmpresaName,
    allowedEmpresas,
    userEmpresas,
    isAdmin
  };
};
