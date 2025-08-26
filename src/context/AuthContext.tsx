
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: 'admin' | 'usuario' | 'medico';
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UserEmpresa {
  id: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
  empresas: {
    id: string;
    nome: string;
    status: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  userEmpresas: UserEmpresa[];
  allowedEmpresas: string[];
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>;
  fetchUserEmpresas: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmpresas, setUserEmpresas] = useState<UserEmpresa[]>([]);
  const { toast } = useToast();

  // Helper para verificar se é admin
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@medpay.com';

  // Lista de IDs das empresas permitidas
  const allowedEmpresas = isAdmin ? [] : userEmpresas.map(ue => ue.empresa_id);

  console.log('AuthContext - isAdmin calculation:', {
    userEmail: user?.email,
    profileRole: profile?.role,
    isAdmin: isAdmin,
    allowedEmpresas: allowedEmpresas
  });

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          // Se o usuário é admin@medpay.com mas não tem perfil, criar um perfil admin
          if (user?.email === 'admin@medpay.com') {
            console.log('Creating admin profile for admin@medpay.com');
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                nome: 'Administrador',
                email: user.email,
                role: 'admin'
              })
              .select()
              .single();
            
            if (createError) {
              console.error('Error creating admin profile:', createError);
              setProfile(null);
            } else {
              console.log('Admin profile created successfully:', newProfile);
              setProfile(newProfile);
            }
          } else {
            setProfile(null);
          }
          return;
        }
      } else {
        console.log('Profile loaded successfully:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception in fetchProfile:', error);
      setProfile(null);
    }
  };

  const fetchUserEmpresas = async () => {
    if (!user || isAdmin) {
      setUserEmpresas([]);
      return;
    }

    try {
      console.log('Fetching user empresas for:', user.id);
      const { data, error } = await supabase
        .from('user_empresas')
        .select(`
          *,
          empresas (
            id,
            nome,
            status
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user empresas:', error);
        setUserEmpresas([]);
        return;
      }

      console.log('User empresas loaded:', data?.length || 0);
      setUserEmpresas(data || []);
    } catch (error) {
      console.error('Exception in fetchUserEmpresas:', error);
      setUserEmpresas([]);
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, 'User:', session?.user?.email || 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated, fetching profile...');
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 100);
        } else {
          console.log('No user session, clearing profile');
          setProfile(null);
          setUserEmpresas([]);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          if (mounted) {
            fetchProfile(session.user.id);
          }
        }, 100);
      } else {
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up auth subscription');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Buscar empresas do usuário quando o perfil mudar
  useEffect(() => {
    if (profile && !isAdmin) {
      fetchUserEmpresas();
    }
  }, [profile, isAdmin]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error.message, error.status);
        
        let errorMessage = "Erro no login";
        let errorDescription = "Verifique suas credenciais e tente novamente.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorDescription = "Email ou senha incorretos.";
        } else if (error.message.includes('Email not confirmed')) {
          errorDescription = "Por favor, confirme seu email antes de fazer login.";
        } else if (error.message.includes('Too many requests')) {
          errorDescription = "Muitas tentativas de login. Aguarde alguns minutos.";
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        
        setLoading(false);
        return { error };
      }

      console.log('Sign in successful for:', data.user?.email);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta.",
      });
      
      return { error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      setLoading(false);
      toast({
        title: "Erro no servidor",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome: nome
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cadastro realizado",
          description: "Verifique seu email para confirmar a conta.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      setUserEmpresas([]);
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (data: Partial<Profile>) => {
    try {
      if (!user) return { error: 'User not authenticated' };

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive"
        });
      } else {
        await fetchProfile(user.id);
        toast({
          title: "Perfil atualizado",
          description: "Seus dados foram atualizados com sucesso.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin,
    userEmpresas,
    allowedEmpresas,
    signIn,
    signUp,
    signOut,
    updateProfile,
    fetchUserEmpresas,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
