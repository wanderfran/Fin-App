import React, { useState, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { Save, User as UserIcon, Loader2, Phone, Lock, ShieldCheck, AlertTriangle, RefreshCw, Database, Camera, Upload } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateProfile: (name: string, phone?: string, avatarUrl?: string) => void;
  onOpenSetup: () => void;
  isRecovery?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateProfile, onOpenSetup, isRecovery }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [showFixDb, setShowFixDb] = useState(false);
  
  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');

  const isDemoUser = () => {
    return user.id === 'dev-offline-id' || 
           user.email === 'teste@exemplo.com' || 
           user.email === 'admin@dev.local';
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setProfileMsg('');
      setShowFixDb(false);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Tenta Upload
      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true
        });

      // Se der erro de Bucket Not Found, tenta criar o bucket (tentativa otimista via JS)
      if (uploadError && (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found'))) {
          const { error: createError } = await supabase.storage.createBucket('avatars', { public: true });
          
          if (!createError) {
              // Se conseguiu criar, tenta o upload novamente
              const retry = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
              uploadError = retry.error;
          }
      }

      if (uploadError) {
        const errMsg = uploadError.message.toLowerCase();
        if (errMsg.includes('bucket') || errMsg.includes('not found') || errMsg.includes('resource')) {
            throw new Error("Bucket 'avatars' não encontrado.");
        }
        throw uploadError;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      setAvatarUrl(publicUrlWithCacheBust);
      
      // 3. Update Profile Table
      await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: publicUrlWithCacheBust,
        updated_at: new Date().toISOString()
      });
      
      onUpdateProfile(name, phone, publicUrlWithCacheBust);
      setProfileMsg('Foto atualizada com sucesso!');

    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Erro ao enviar imagem.';
      setProfileMsg(msg);
      
      // Ativa o botão de correção
      if (msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('relation') || msg.toLowerCase().includes('policy')) {
          setShowFixDb(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg('');
    setShowFixDb(false);

    if (isDemoUser()) {
        setTimeout(() => {
            onUpdateProfile(name, phone, avatarUrl);
            setProfileMsg('Perfil atualizado (Modo Demo)');
            setProfileLoading(false);
            setTimeout(() => setProfileMsg(''), 3000);
        }, 800);
        return;
    }

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: name,
        phone: phone,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
      
      onUpdateProfile(name, phone, avatarUrl);
      setProfileMsg('Dados salvos com sucesso!');
      setTimeout(() => setProfileMsg(''), 3000);

    } catch (err: any) {
      console.error("Erro Supabase:", err);
      let displayError = "Erro desconhecido.";
      let needsFix = false;

      if (typeof err === 'string') displayError = err;
      else if (err?.message) displayError = err.message;
      
      const lowerErr = displayError.toLowerCase();

      if (lowerErr.includes('relation "profiles"')) {
         displayError = "Tabela 'profiles' não encontrada.";
         needsFix = true;
      }

      setProfileMsg(displayError);
      setShowFixDb(needsFix);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg('');

    if (isDemoUser()) return;

    if (newPassword !== confirmPassword) {
        setPassMsg('Senhas não conferem.');
        return;
    }
    setPassLoading(true);
    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setPassMsg('Senha atualizada!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPassMsg(''), 3000);
    } catch (err: any) {
        setPassMsg(err.message || 'Erro ao alterar senha.');
    } finally {
        setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-3xl font-extrabold text-white">Sua Conta</h1>
        <p className="text-[#88998C]">Gerencie seus dados e privacidade.</p>
      </header>
      
      {isRecovery && (
        <div className="bg-[#ccff00] text-black p-6 rounded-[2rem] font-bold text-center animate-pulse shadow-lg shadow-[#ccff00]/20">
          <p className="text-lg">Modo de Recuperação Ativo</p>
          <p className="text-sm font-medium opacity-80 mt-1">Crie uma nova senha abaixo para restaurar o acesso seguro à sua conta.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card 1: Dados Pessoais */}
          <div className="bg-[#161d19] p-8 rounded-[2.5rem] border border-[#2A3530]">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 border-b border-[#2A3530] pb-6">
                <div className="p-2 bg-[#ccff00] text-black rounded-lg">
                    <UserIcon size={20} /> 
                </div>
                Dados Pessoais
            </h3>

            <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 rounded-full bg-[#1F2923] border-2 border-[#2A3530] overflow-hidden group">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                const fallback = document.createElement('div');
                                fallback.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5a6b61" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                e.currentTarget.parentElement?.appendChild(fallback);
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#5a6b61]">
                            <UserIcon size={40} />
                        </div>
                    )}
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                    >
                        {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                    </button>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={uploadAvatar} 
                    className="hidden" 
                    accept="image/*"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-xs font-bold text-[#ccff00] hover:underline flex items-center gap-1"
                >
                    <Upload size={12} /> Alterar Foto
                </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5a6b61] uppercase">Email</label>
                    <input 
                        type="text" 
                        value={user.email} 
                        disabled 
                        className="w-full p-4 bg-[#131a15] text-[#88998C] rounded-2xl border border-[#2A3530] cursor-not-allowed select-none"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5a6b61] uppercase">Nome</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]"
                            placeholder="Seu nome"
                        />
                        <UserIcon size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#5a6b61] uppercase">Telefone</label>
                    <div className="relative">
                        <input 
                            type="tel" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)}
                            className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00]"
                            placeholder="(00) 00000-0000"
                        />
                        <Phone size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                    </div>
                </div>

                {profileMsg && (
                    <div className={`p-4 rounded-2xl text-sm font-medium text-center ${profileMsg.includes('sucesso') ? 'bg-[#ccff00]/10 text-[#ccff00]' : 'bg-red-900/20 text-red-400'}`}>
                        {profileMsg}
                        {showFixDb && (
                            <button type="button" onClick={onOpenSetup} className="mt-3 w-full p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                                <Database size={14} /> Corrigir Banco de Dados
                            </button>
                        )}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={profileLoading}
                    className="w-full bg-[#ccff00] hover:bg-[#b3ff66] disabled:opacity-50 text-black px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mt-4 text-lg"
                >
                    {profileLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar
                </button>
            </form>
          </div>

          {/* Card 2: Segurança */}
          <div className="space-y-6">
            <div className={`bg-[#161d19] p-8 rounded-[2.5rem] border ${isRecovery ? 'border-[#ccff00] shadow-[0_0_20px_rgba(204,255,0,0.1)]' : 'border-[#2A3530]'}`}>
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 border-b border-[#2A3530] pb-6">
                    <div className="p-2 bg-white text-black rounded-lg">
                        <ShieldCheck size={20} /> 
                    </div>
                    Segurança
                </h3>

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5a6b61] uppercase">Nova Senha</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-white"
                                placeholder="******"
                            />
                            <Lock size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[#5a6b61] uppercase">Confirmar</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-4 pl-12 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-white"
                                placeholder="******"
                            />
                            <Lock size={20} className="absolute left-4 top-4 text-[#5a6b61]" />
                        </div>
                    </div>

                    {passMsg && (
                        <div className={`p-4 rounded-2xl text-sm font-medium text-center ${passMsg.includes('sucesso') ? 'bg-[#ccff00]/10 text-[#ccff00]' : 'bg-red-900/20 text-red-400'}`}>
                            {passMsg}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={passLoading || !newPassword}
                        className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 text-black px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mt-4 text-lg"
                    >
                        {passLoading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
                        Trocar Senha
                    </button>
                </form>
            </div>
          </div>
      </div>
    </div>
  );
};