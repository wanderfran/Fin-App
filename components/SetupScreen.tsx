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

  // Carrega valores do localStorage ou padrão
  useEffect(() => {
    const storedUrl = localStorage.getItem('sb_url');
    const storedKey = localStorage.getItem('sb_key');
    
    // Configurações padrão fornecidas
    setUrl(storedUrl || 'https://awqwktpqzrasptzgbdin.supabase.co');
    setKey(storedKey || 'sb_publishable_RVjdzZWWcqtfgh4EP_7rjA_-6rNKNfz');
  }, []);

  // Validação em tempo real da chave
  useEffect(() => {
    if (key.startsWith('sb_secret')) {
        setKeyError('Cuidado! Esta parece ser uma chave secreta ("Secret Key"). Em aplicativos web, você deve usar apenas a "Anon / Public Key". O uso de chaves secretas no navegador é bloqueado por segurança.');
    } else {
        setKeyError('');
    }
  }, [key]);

  const handleSave = () => {
    if (!url || !key) return;
    try {
      new URL(url); // Valida URL
      localStorage.setItem('sb_url', url);
      localStorage.setItem('sb_key', key);
      window.location.reload();
    } catch (e) {
      alert('A URL do projeto é inválida.');
    }
  };

  const sqlScript = `-- 1. Tabela de Transações
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

-- 2. Tabela de Contas
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

-- 3. Tabela de Metas
create table if not exists public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null,
  deadline date not null,
  created_at timestamp with time zone default now()
);

-- 4. Tabela de Perfil (CORREÇÃO DE ERRO DE CACHE)
-- Esta tabela é essencial para salvar nome e telefone
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  phone text,
  updated_at timestamp with time zone default now()
);

-- Garante que a coluna phone existe (se a tabela já foi criada antes)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='phone') then
    alter table public.profiles add column phone text;
  end if;
end $$;

-- 5. Habilitar Segurança (RLS)
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.goals enable row level security;
alter table public.profiles enable row level security;

-- 6. Criar Políticas de Acesso (Drop para recriar e evitar duplicidade)
drop policy if exists "Users can manage their own transactions" on public.transactions;
create policy "Users can manage their own transactions" 
on public.transactions for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own bills" on public.bills;
create policy "Users can manage their own bills" 
on public.bills for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own goals" on public.goals;
create policy "Users can manage their own goals" 
on public.goals for all using (auth.uid() = user_id);

drop policy if exists "Users can manage their own profile" on public.profiles;
create policy "Users can manage their own profile" 
on public.profiles for all using (auth.uid() = id);

-- DICA: Se você vê erro de 'schema cache', rodar este script
-- força o Supabase a atualizar a definição das tabelas.
-- EM SEGUIDA, RECARREGUE A PÁGINA DO APP.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row relative">
        
        {onCancel && (
            <button onClick={onCancel} className="absolute top-4 left-4 z-10 p-2 bg-white/20 hover:bg-black/10 text-slate-600 rounded-full md:text-white">
                <ArrowLeft />
            </button>
        )}

        {/* Lado Esquerdo: Instruções e Script */}
        <div className="w-full md:w-1/2 bg-indigo-900 p-8 text-white flex flex-col pt-16 md:pt-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Database className="text-indigo-300" /> Corrigir Banco de Dados
            </h2>
            <div className="bg-orange-500/20 p-3 rounded-lg border border-orange-500/50 mb-3 text-xs">
                <strong>Atenção:</strong> Copie e rode o código abaixo no SQL Editor do Supabase. Depois, recarregue a página.
            </div>
            
            <div className="relative bg-indigo-950/50 rounded-xl p-4 border border-indigo-800 h-64 overflow-y-auto font-mono text-xs text-indigo-100 shadow-inner group">
              <pre className="whitespace-pre-wrap">{sqlScript}</pre>
              <button 
                onClick={copyToClipboard}
                className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg transition-colors shadow-lg"
                title="Copiar SQL"
              >
                {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-4">
                 {copied ? <p className="text-xs text-green-400 font-bold">Código copiado!</p> : <div></div>}
                 <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-colors"
                 >
                    <RefreshCw size={14} /> Recarregar App
                 </button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário de Conexão */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <div className="mb-6 text-center md:text-left">
            <Logo className="h-10 w-auto mx-auto md:mx-0 mb-4" textColor="#1e293b" />
            <h1 className="text-2xl font-bold text-slate-800">Passo 2: Conectar</h1>
            <p className="text-slate-500 text-sm">Verifique se as credenciais abaixo estão corretas.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">URL do Projeto</label>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://seu-projeto.supabase.co"
                className="w-full p-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Chave ANON / PUBLIC</label>
              <input 
                type="text" 
                value={key} 
                onChange={e => setKey(e.target.value.trim())} 
                placeholder="Cole aqui a chave 'anon' public"
                className={`w-full p-3 bg-slate-50 text-slate-900 rounded-xl border outline-none focus:ring-2 font-mono text-sm ${keyError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'}`}
              />
              {keyError && (
                  <div className="flex items-start gap-2 mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{keyError}</span>
                  </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!url || !key}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
          >
            <Save size={20} />
            Salvar e Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
};