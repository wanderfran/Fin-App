import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { Save, User as UserIcon, Loader2, Phone, Lock, ShieldCheck, AlertTriangle, RefreshCw, Database } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateProfile: (name: string, phone?: string) => void;
  onOpenSetup: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile, onOpenSetup }) => {
  // Profile State
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [showReload, setShowReload] = useState(false);
  const [showFixDb, setShowFixDb] = useState(false);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');

  // Helper para verificar usuários de teste
  const isDemoUser = () => {
    return user.id === 'dev-offline-id' || 
           user.email === 'teste@exemplo.com' || 
           user.email === 'admin@dev.local';
  };

  // Handler: Update Profile Data
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    setShowReload(false);
    setShowFixDb(false);

    // 1. Lógica para usuário Demo
    if (isDemoUser()) {
        setTimeout(() => {
            onUpdateProfile(name, phone);
            setProfileMsg('Perfil atualizado (Modo Demo)');
            setProfileLoading(false);
            setTimeout(() => setProfileMsg(''), 3000);
        }, 800);
        return;
    }

    // 2. Tentativa Real Estrita
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: name,
        phone: phone,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      onUpdateProfile(name, phone);
      setProfileMsg('Dados salvos no banco com sucesso!');
      setTimeout(() => setProfileMsg(''), 3000);

    } catch (err: any) {
      console.error("Erro Supabase:", err);
      
      let displayError = "Erro desconhecido.";
      let needsFix = false;

      // --- ESTRATÉGIA DE EXTRAÇÃO DE ERRO ---
      if (typeof err === 'string') {
          displayError = err;
      } else if (err && typeof err === 'object') {
          // Verifica propriedades padrão de erro
          // Nota: err.message é comum, err.code é do Postgres
          const rawMsg = err.message || err.error_description || err.details || err.hint;
          const code = err.code; 

          if (rawMsg && typeof rawMsg === 'string') {
              displayError = rawMsg;
          } else {
              // Se for um objeto Error nativo do JS, JSON.stringify retorna {}, então tentamos .toString()
              if (Object.prototype.toString.call(err) === '[object Error]') {
                  displayError = err.toString();
              } else {
                  try {
                    displayError = JSON.stringify(err);
                  } catch {
                    displayError = "Erro não serializável";
                  }
              }
          }

          // Lógica Específica do Supabase/Postgres
          const lowerMsg = displayError.toLowerCase();
          
          // 42P01: undefined_table (A causa mais provável)
          if (code === '42P01' || lowerMsg.includes('does not exist') || lowerMsg.includes('relation "profiles"')) {
             displayError = "Tabela 'profiles' não existe no banco.";
             needsFix = true;
          }
          // 42501: insufficient_privilege (RLS)
          else if (code === '42501' || lowerMsg.includes('row-level security') || lowerMsg.includes('violates new row')) {
             displayError = "Erro de permissão (RLS).";
             needsFix = true;
          }
          // Erro de Cache (Pery)
          else if (lowerMsg.includes('schema cache')) {
             displayError = "Erro de Cache de Schema.";
             needsFix = true;
          }
      }

      // --- SANITIZAÇÃO FINAL (Adeus [object Object]) ---
      if (!displayError || displayError === '{}' || displayError.includes('[object Object]')) {
          displayError = "Erro de comunicação ou tabela inexistente.";
          needsFix = true; // Assumimos que se o erro é bizarro, provavelmente é estrutura de banco
      }

      setProfileMsg(displayError);
      setShowFixDb(needsFix);

    } finally {
      setProfileLoading(false);
    }
  };

  // Handler: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');

    if (isDemoUser()) {
        setPassMsg('Senha simulada alterada (Modo Demo)');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassMsg(''), 3000);
        return;
    }

    if (newPassword !== confirmPassword) {
        setPassMsg('As senhas não coincidem.');
        return;
    }
    if (newPassword.length < 6) {
        setPassMsg('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    setPassLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        setPassMsg('Senha alterada no servidor!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassMsg(''), 3000);
    } catch (err: any) {
        console.error(err);
        const errorMessage = typeof err === 'string' ? err : (err?.message || 'Erro ao alterar senha.');
        setPassMsg(errorMessage);
    } finally {
        setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Minha Conta</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e segurança.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Dados Pessoais */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <UserIcon size={20} /> 
                </div>
                Dados Pessoais
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email (Login)</label>
                    <input 
                        type="text" 
                        value={user.email} 
                        disabled 
                        className="w-full p-3 bg-slate-100 text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed select-none"
                    />
                    <p className="text-[10px] text-slate-400">O email não pode ser alterado.</p>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome de Exibição</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Seu nome"
                        />
                        <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</label>
                    <div className="relative">
                        <input 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)}
                            className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="(00) 00000-0000"
                        />
                        <Phone size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    </div>
                </div>

                {profileMsg && (
                    <div className={`p-4 rounded-xl text-sm font-medium text-center flex flex-col items-center justify-center gap-2 ${profileMsg.includes('sucesso') || profileMsg.includes('Demo') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <div className="flex items-center gap-2">
                           {(!profileMsg.includes('sucesso') && !profileMsg.includes('Demo')) && <AlertTriangle size={18} className="shrink-0" />}
                           <span className="break-words w-full">{profileMsg}</span>
                        </div>
                        
                        {/* Botão para corrigir banco de dados */}
                        {showFixDb && (
                            <button 
                                type="button" 
                                onClick={onOpenSetup}
                                className="mt-2 w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-red-200 animate-pulse"
                            >
                                <Database size={14} /> Corrigir Banco de Dados
                            </button>
                        )}

                        {/* Botão de reload (apenas se for puramente cache mas não estrutura) */}
                        {showReload && !showFixDb && (
                            <button 
                                type="button" 
                                onClick={() => window.location.reload()}
                                className="mt-1 px-4 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                                <RefreshCw size={12} /> Recarregar Página
                            </button>
                        )}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={profileLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4"
                >
                    {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar no Banco
                </button>
            </form>
          </div>

          {/* Card 2: Segurança */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                        <ShieldCheck size={20} /> 
                    </div>
                    Segurança
                </h3>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Nova Senha</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-3 pl-10 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Repita a senha"
                            />
                            <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                        </div>
                    </div>

                    {passMsg && (
                        <div className={`p-3 rounded-xl text-sm font-medium text-center ${passMsg.includes('sucesso') || passMsg.includes('servidor') || passMsg.includes('Demo') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {passMsg}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={passLoading || !newPassword}
                        className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4"
                    >
                        {passLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                        Atualizar Senha
                    </button>
                </form>
            </div>

            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-2 text-sm">Sincronização Ativa</h4>
                <p className="text-xs text-indigo-700 leading-relaxed">
                    Seus dados são salvos diretamente no banco de dados. Se houver falha de conexão, as alterações não serão aplicadas.
                </p>
            </div>
          </div>
      </div>
    </div>
  );
};