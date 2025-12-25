import React, { useState } from 'react';
import { ArrowRight, UserPlus, ArrowLeft, Loader2, Zap, Settings, User as UserIcon, Phone } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLogin: (user: User) => void;
  onOpenSetup?: () => void;
}

type AuthView = 'login' | 'register';

export const LoginScreen: React.FC<AuthProps> = ({ onLogin, onOpenSetup }) => {
  const [view, setView] = useState<AuthView>('login');
  
  // Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const resetForm = () => {
    setError('');
    setMsg('');
    setPassword('');
    setName('');
    setPhone('');
  };

  const translateError = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
    if (errorMsg.includes('User already registered')) return 'Este email já está cadastrado.';
    if (errorMsg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (errorMsg.includes('Email not confirmed')) return 'Verifique seu email para confirmar o cadastro.';
    if (errorMsg.includes('Forbidden') || errorMsg.includes('JWT')) return 'Erro de configuração da API. Verifique suas chaves no botão de engrenagem.';
    return errorMsg || 'Ocorreu um erro inesperado. Tente novamente.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (view === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        if (data.user) {
          // Fetch additional profile data
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          
          onLogin({
            id: data.user.id,
            email: data.user.email!,
            name: profile?.display_name || data.user.email!.split('@')[0],
            phone: profile?.phone
          });
        }
      } else {
        // Register Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw error;
        
        // Immediately Create Profile if user was created
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                display_name: name,
                phone: phone,
                updated_at: new Date().toISOString()
            });

            // Auto-login or ask for confirmation depending on Supabase settings
            if (data.session) {
                 onLogin({
                    id: data.user.id,
                    email: data.user.email!,
                    name: name || data.user.email!.split('@')[0],
                    phone: phone
                 });
            } else {
                 setMsg('Conta criada! Verifique seu email para confirmar.');
                 setView('login');
                 resetForm();
            }
        }
      }
    } catch (err: any) {
      setError(translateError(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setLoading(true);
    setError('');
    const devEmail = 'teste@exemplo.com';
    const devPass = '123456';

    try {
      console.log("Iniciando Login Rápido...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPass
      });

      if (data?.user) {
        onLogin({
          id: data.user.id,
          email: data.user.email!,
          name: 'Usuário Teste'
        });
        return;
      }

      if (error && error.message.includes('Invalid login credentials')) {
         const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: devEmail,
          password: devPass
        });
        if (signUpData?.user) {
           await supabase.from('profiles').upsert({ id: signUpData.user.id, display_name: 'Usuário Teste' });
           onLogin({
            id: signUpData.user.id,
            email: signUpData.user.email!,
            name: 'Usuário Teste'
          });
          return;
        }
        if (signUpError) throw signUpError;
      } else if (error) {
        throw error;
      }

    } catch (err: any) {
       // Fallback logic
       onLogin({
          id: 'dev-offline-id',
          email: 'admin@dev.local',
          name: 'Modo Offline (Dev)'
        });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 relative">
        
        {/* Settings Button */}
        {onOpenSetup && (
          <button 
            onClick={onOpenSetup}
            className="absolute top-6 right-6 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
            title="Configurar Conexão (Backend)"
          >
            <Settings size={20} />
          </button>
        )}

        <div className="bg-indigo-800 p-8 text-center relative">
          {view !== 'login' && (
             <button 
               onClick={() => { setView('login'); resetForm(); }}
               className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors"
             >
               <ArrowLeft size={24} />
             </button>
          )}
          
          <div className="mb-2">
            <Logo className="h-16 w-auto mx-auto" textColor="white" />
          </div>
          <p className="text-indigo-100 text-sm">Controle seu dinheiro de forma simples.</p>
        </div>

        <div className="p-8">
          
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {view === 'login' ? 'Acesse seu perfil' : 'Crie sua conta'}
          </h2>
          
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100">{error}</div>}
          {msg && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl text-center border border-emerald-100">{msg}</div>}
          
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* New Fields for Registration */}
            {view === 'register' && (
                <>
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                        <div className="relative">
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Seu nome" />
                            <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        </div>
                    </div>
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                         <div className="relative">
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="(00) 00000-0000" />
                             <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="seu@email.com" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
              </div>
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="******" />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : (view === 'login' ? <>Entrar <ArrowRight size={20} /></> : <>Criar Conta <UserPlus size={20} /></>)}
            </button>
          </form>

          {view === 'login' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
                <button 
                type="button"
                onClick={handleQuickLogin}
                disabled={loading}
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-sm"
                >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                Login Rápido (Teste)
                </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => { setView(view === 'login' ? 'register' : 'login'); resetForm(); }} className="text-slate-500 text-sm font-medium hover:text-indigo-600 transition-colors">
              {view === 'login' ? 'Não tem conta? Crie agora' : 'Já tem cadastro? Faça login'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};