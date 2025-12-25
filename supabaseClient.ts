import { createClient } from '@supabase/supabase-js';

// Tenta recuperar credenciais salvas no navegador
const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('sb_url') : '';
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('sb_key') : '';

// Configurações fornecidas pelo usuário
const DEFAULT_URL = 'https://awqwktpqzrasptzgbdin.supabase.co';
const DEFAULT_KEY = 'sb_publishable_RVjdzZWWcqtfgh4EP_7rjA_-6rNKNfz';

// Prioriza o que está no localStorage, senão usa o padrão fornecido
const PROJECT_URL = storedUrl || DEFAULT_URL;
const API_KEY = storedKey || DEFAULT_KEY;

// Verifica se a chave é válida (não é uma chave secreta de servidor)
export const hasValidKey = !!API_KEY && !API_KEY.startsWith('sb_secret');

// Flag de configuração
export const isSupabaseConfigured = true;

// Inicializa o cliente Supabase
export const supabase = createClient(PROJECT_URL, API_KEY);