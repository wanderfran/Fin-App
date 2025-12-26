import React, { useState } from 'react';
import { ArrowRight, UserPlus, ArrowLeft, Loader2, Zap, Settings, User as UserIcon, Phone, KeyRound, Mail } from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';
import { supabase } from '../supabaseClient';

interface AuthProps {
  onLogin: (user: User) => void;
  onOpenSetup?: () => void;
}

type AuthView = 'login' | 'register' | 'forgotPassword';

export const LoginScreen: React.FC<AuthProps> = ({ onLogin, onOpenSetup }) => {
  const [view, setView] = useState<AuthView>('login');
  
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
    // Mantemos o email preenchido se o usuário estiver alternando entre login e esqueci senha
    if (view === 'register') setName('');
    if (view === 'register') setPhone('');
  };

  const translateError = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) return 'Credenciais incorretas.';
    if (errorMsg.includes('User already registered')) return 'Email já cadastrado.';
    if (errorMsg.includes('security purposes')) return 'Aguarde alguns segundos antes de tentar novamente.';
    return errorMsg || 'Erro inesperado.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');

    try {
      if (view === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          onLogin({
            id: data.user.id,
            email: data.user.email!,
            name: profile?.display_name || data.user.email!.split('@')[0],
            phone: profile?.phone
          });
        }
      } else if (view === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                display_name: name,
                phone: phone,
                updated_at: new Date().toISOString()
            });
            if (data.session) {
                 onLogin({
                    id: data.user.id,
                    email: data.user.email!,
                    name: name || data.user.email!.split('@')[0],
                    phone: phone
                 });
            } else {
                 setMsg('Verifique seu email!');
                 setView('login');
                 resetForm();
            }
        }
      } else if (view === 'forgotPassword') {
        // Lógica de recuperação de senha
        // window.location.origin pega a URL atual automaticamente.
        // Se estiver na Vercel: https://finapp-rho.vercel.app
        // Se estiver local: http://localhost:5173
        // IMPORTANTE: Essa URL deve estar listada em "Redirect URLs" no Supabase Dashboard.
        const redirectUrl = window.location.origin;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl, 
        });
        
        if (error) throw error;
        setMsg(`Link enviado para ${email}. Verifique a caixa de entrada e spam.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(translateError(err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
      setView(newView);
      resetForm();
  };

  return (
    <div className="min-h-screen bg-[#0b100d] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#1a2e1d,transparent)] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161d19] rounded-[2.5rem] shadow-2xl border border-[#2A3530] overflow-hidden relative z-10">
        
        <div className="bg-[#ccff00] p-10 text-center relative flex flex-col items-center">
          {view !== 'login' && (
             <button onClick={() => switchView('login')} className="absolute top-6 left-6 text-black/60 hover:text-black transition-colors">
               <ArrowLeft size={24} />
             </button>
          )}
          <Logo className="h-12 w-auto mb-2 text-black" textColor="black" />
          <p className="text-black/70 text-sm font-medium">Controle financeiro inteligente.</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {view === 'login' && 'Bem-vindo de volta'}
            {view === 'register' && 'Crie sua conta'}
            {view === 'forgotPassword' && 'Recuperar Senha'}
          </h2>
          
          <p className="text-[#88998C] text-sm text-center mb-6">
            {view === 'login' && 'Insira seus dados para acessar.'}
            {view === 'register' && 'Comece a organizar suas finanças hoje.'}
            {view === 'forgotPassword' && 'Enviaremos um link mágico para o seu email.'}
          </p>
          
          {error && <div className="mb-4 p-3 bg-red-900/30 text-red-300 text-sm rounded-xl text-center border border-red-900/50">{error}</div>}
          {msg && <div className="mb-4 p-3 bg-[#ccff00]/10 text-[#ccff00] text-sm rounded-xl text-center border border-[#ccff00]/20">{msg}</div>}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'register' && (
                <>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5a6b61] uppercase">Nome</label>
                        <div className="relative">
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]" placeholder="Seu nome" />
                            <UserIcon size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5a6b61] uppercase">Celular</label>
                         <div className="relative">
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]" placeholder="(00) 00000-0000" />
                             <Phone size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                        </div>
                    </div>
                </>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5a6b61] uppercase">Email</label>
              <div className="relative">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]" placeholder="seu@email.com" />
                <Mail size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
              </div>
            </div>
            
            {view !== 'forgotPassword' && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#5a6b61] uppercase">Senha</label>
                        {view === 'login' && (
                            <button 
                                type="button" 
                                onClick={() => switchView('forgotPassword')}
                                className="text-xs font-medium text-[#ccff00] hover:underline"
                            >
                                Esqueceu a senha?
                            </button>
                        )}
                    </div>
                    <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]" placeholder="******" />
                </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading || (view === 'forgotPassword' && !!msg)}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 mt-6 transition-all text-lg shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                  view === 'login' ? <>Entrar <ArrowRight size={20} /></> : 
                  view === 'register' ? 'Cadastrar' : 
                  'Enviar Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {view === 'login' && (
                <button onClick={() => switchView('register')} className="text-[#88998C] text-sm font-medium hover:text-white transition-colors">
                Criar conta gratuita
                </button>
            )}
            {(view === 'register' || view === 'forgotPassword') && (
                <button onClick={() => switchView('login')} className="text-[#88998C] text-sm font-medium hover:text-white transition-colors">
                Voltar para login
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};