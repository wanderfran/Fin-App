import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Save, Database, Copy, CheckCircle, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

interface SetupProps {
  onCancel?: () => void;
}

export const SetupScreen: React.FC<SetupProps> = ({ onCancel }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');
    setUrl(storedUrl || 'https://awqwktpqzrasptzgbdin.supabase.co');
    setKey(storedKey || 'sb_publishable_RVjdzZWWcqtfgh4EP_7rjA_-6rNKNfz');
  }, []);

  useEffect(() => {
    if (key.startsWith('sb_secret')) {
        setKeyError('Use apenas a chave pública (Anon Key).');
    } else {
        setKeyError('');
    }
  }, [key]);

  const handleSave = () => {
    if (!url || !key) return;
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
    window.location.reload();
  };

  const fullSqlScript = `-- SETUP COMPLETO (RODE NO SUPABASE SQL EDITOR)

-- 1. Storage: Criar Bucket 'avatars' (Forçar Público)
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Tabelas de Dados
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text not null,
  payment_method text not null,
  date date not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.bills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  amount numeric not null,
  due_date integer not null,
  is_recurring boolean default false,
  is_paid boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null,
  deadline date not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  phone text,
  avatar_url text,
  updated_at timestamp with time zone default now()
);

-- Atualização de Colunas (Idempotente)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
    alter table public.profiles add column phone text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;

-- 3. Habilitar RLS
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.goals enable row level security;
alter table public.profiles enable row level security;

-- 4. Políticas de Dados (Tabelas)
do $$
begin
  -- Transactions
  if not exists (select 1 from pg_policies where tablename = 'transactions' and policyname = 'Users can manage their own transactions') then
    create policy "Users can manage their own transactions" on public.transactions for all using (auth.uid() = user_id);
  end if;
  
  -- Bills
  if not exists (select 1 from pg_policies where tablename = 'bills' and policyname = 'Users can manage their own bills') then
    create policy "Users can manage their own bills" on public.bills for all using (auth.uid() = user_id);
  end if;

  -- Goals
  if not exists (select 1 from pg_policies where tablename = 'goals' and policyname = 'Users can manage their own goals') then
    create policy "Users can manage their own goals" on public.goals for all using (auth.uid() = user_id);
  end if;

  -- Profile
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can manage their own profile') then
    create policy "Users can manage their own profile" on public.profiles for all using (auth.uid() = id);
  end if;
end $$;

-- 5. Políticas de Storage (Imagens)
-- Usamos DO blocks para evitar erro de 'ownership' ao tentar dropar policies existentes
do $$
begin
  -- Select (Público)
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Avatar images are publicly accessible.') then
    create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
  end if;

  -- Insert (Auth Users)
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Anyone can upload an avatar.') then
    create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
  end if;

  -- Update (Owner)
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Anyone can update their own avatar.') then
    create policy "Anyone can update their own avatar." on storage.objects for update using ( auth.uid() = owner ) with check ( bucket_id = 'avatars' );
  end if;
end $$;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b100d] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-[#161d19] rounded-[2.5rem] shadow-2xl border border-[#2A3530] overflow-hidden flex flex-col md:flex-row relative">
        
        {onCancel && (
            <button onClick={onCancel} className="absolute top-6 left-6 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full">
                <ArrowLeft />
            </button>
        )}

        <div className="w-full md:w-1/2 bg-[#1F2923] p-10 text-white flex flex-col pt-20 md:pt-10 border-r border-[#2A3530]">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-[#ccff00]">
              <Database size={20} /> Banco de Dados
            </h2>
            <p className="text-[#88998C] text-sm mb-4">Copie o SQL abaixo e rode no Supabase Editor para habilitar o Storage de imagens.</p>
            
            <div className="relative bg-[#0b100d] rounded-2xl p-4 border border-[#2A3530] h-64 overflow-y-auto font-mono text-xs text-[#ccff00] shadow-inner">
              <pre className="whitespace-pre-wrap">{fullSqlScript}</pre>
              <button 
                onClick={copyToClipboard}
                className="absolute top-3 right-3 bg-[#ccff00] hover:bg-[#b3ff66] text-black p-2 rounded-lg transition-colors shadow-lg"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
                 {copied ? <p className="text-xs text-[#ccff00] font-bold">Copiado!</p> : <div></div>}
                 <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A3530] hover:bg-[#35423c] rounded-xl text-xs font-bold transition-colors text-white"
                 >
                    <RefreshCw size={14} /> Recarregar
                 </button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="mb-8">
            <Logo className="h-10 w-auto mb-4" textColor="#ccff00" />
            <h1 className="text-3xl font-bold text-white">Conexão</h1>
            <p className="text-[#88998C] text-sm mt-1">Configure o backend Supabase.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5a6b61] uppercase">URL do Projeto</label>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                className="w-full p-4 bg-[#1F2923] text-white rounded-2xl border border-[#2A3530] outline-none focus:border-[#ccff00] font-mono text-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#5a6b61] uppercase">Chave Pública (Anon)</label>
              <input 
                type="text" 
                value={key} 
                onChange={e => setKey(e.target.value.trim())} 
                className={`w-full p-4 bg-[#1F2923] text-white rounded-2xl border outline-none focus:border-[#ccff00] font-mono text-sm ${keyError ? 'border-red-500' : 'border-[#2A3530]'}`}
              />
              {keyError && (
                  <div className="flex items-start gap-2 text-xs text-red-400">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{keyError}</span>
                  </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!url || !key}
            className="w-full mt-8 bg-[#ccff00] hover:bg-[#b3ff66] disabled:opacity-50 text-black font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all text-lg"
          >
            <Save size={20} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};