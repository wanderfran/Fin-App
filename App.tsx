import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { User } from './types';
import { LoginScreen } from './components/Auth';
import { SetupScreen } from './components/SetupScreen';
import { Settings } from './components/Settings';
import { Logo } from './components/Logo';
import { LayoutDashboard, List, Receipt, Target, Menu, X, LogOut, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Bills } from './components/Bills';
import { Goals } from './components/Goals';
import { supabase, hasValidKey } from './supabaseClient';

type Tab = 'dashboard' | 'transactions' | 'bills' | 'goals' | 'settings';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  
  // Auth Session Management
  useEffect(() => {
    if (!hasValidKey) {
      setSessionLoading(false);
      return;
    }

    const initSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const userData: User = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0]
            };
            
            // Busca estrita do Banco de Dados (Sem Local Storage)
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, phone')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    if (profile.display_name && typeof profile.display_name === 'string') {
                        userData.name = profile.display_name;
                    }
                    if (profile.phone && typeof profile.phone === 'string') {
                        userData.phone = profile.phone;
                    }
                }
            } catch (e) {
                console.error("Erro ao buscar perfil do banco:", e);
                // Se der erro, usa apenas o email como nome (fallback básico de UI)
            }

            setUser(userData);
        }
        setSessionLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         setUser(prev => {
            if (prev && prev.id === session.user.id) return prev;
            return {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0]
            };
         });
         // Em uma mudança de auth, idealmente recarregaríamos o perfil completo novamente
         // mas o initSession roda no mount.
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleUpdateProfile = (newName: string, newPhone?: string) => {
      // Atualiza o estado da aplicação APÓS o sucesso no banco (chamado pelo Settings.tsx)
      setUser(prev => prev ? { ...prev, name: newName, phone: newPhone } : null);
  };

  // Pass userId to store so it loads ONLY that user's data
  const { 
    transactions, bills, goals, loading: dataLoading,
    addTransaction, deleteTransaction, 
    addBill, toggleBillPaid, 
    addGoal, updateGoalProgress 
  } = useStore(user?.id || '');

  const NavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-4 rounded-2xl transition-all duration-300 ${
        activeTab === tab 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 font-semibold' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );

  // 1. Show setup explicitly requested
  if (showSetup) {
    return <SetupScreen onCancel={() => setShowSetup(false)} />;
  }

  // 2. Loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // 3. Login
  if (!user) {
    return <LoginScreen onLogin={handleLogin} onOpenSetup={() => setShowSetup(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 animate-in fade-in duration-700">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 p-6 fixed h-full z-10">
        <div className="mb-8 px-2">
          <Logo className="h-14 w-auto" textColor="#1e293b" />
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem tab="dashboard" icon={LayoutDashboard} label="Visão Geral" />
          <NavItem tab="transactions" icon={List} label="Lançamentos" />
          <NavItem tab="bills" icon={Receipt} label="Contas do Mês" />
          <NavItem tab="goals" icon={Target} label="Metas" />
          <div className="pt-4 mt-4 border-t border-slate-50">
             <NavItem tab="settings" icon={SettingsIcon} label="Ajustes" />
          </div>
        </nav>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                {user.name && typeof user.name === 'string' ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                    {user.name && typeof user.name === 'string' ? user.name : 'Usuário'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                    {user.phone && typeof user.phone === 'string' ? user.phone : 'Online'}
                </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={22} />
            <span className="font-medium">Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 w-full bg-white z-20 px-6 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="h-10 w-auto" textColor="#1e293b" />
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-10 pt-20 px-6 animate-in slide-in-from-top-10 flex flex-col">
          <div className="mb-6 pb-6 border-b border-slate-100 flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                 {user.name && typeof user.name === 'string' ? user.name.charAt(0).toUpperCase() : 'U'}
             </div>
             <div>
                <p className="text-sm text-slate-500">Olá,</p>
                <p className="text-lg font-bold text-slate-800 truncate">
                    {user.name && typeof user.name === 'string' ? user.name : 'Usuário'}
                </p>
             </div>
          </div>
          <nav className="space-y-2 flex-1">
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Visão Geral" />
            <NavItem tab="transactions" icon={List} label="Lançamentos" />
            <NavItem tab="bills" icon={Receipt} label="Contas do Mês" />
            <NavItem tab="goals" icon={Target} label="Metas" />
            <NavItem tab="settings" icon={SettingsIcon} label="Ajustes" />
          </nav>
          <div className="pb-8">
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-red-50 text-red-600 font-bold"
            >
              <LogOut size={20} /> Sair
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-6 lg:p-10 pt-24 lg:pt-10 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto">
          {dataLoading && activeTab !== 'settings' && (
             <div className="mb-4 flex items-center gap-2 text-indigo-600 bg-indigo-50 p-3 rounded-xl animate-pulse">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-sm font-medium">Sincronizando com Supabase...</span>
             </div>
          )}
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} bills={bills} goals={goals} />}
          {activeTab === 'transactions' && <Transactions data={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />}
          {activeTab === 'bills' && <Bills bills={bills} onAdd={addBill} onPay={toggleBillPaid} />}
          {activeTab === 'goals' && <Goals goals={goals} onAdd={addGoal} onUpdate={updateGoalProgress} />}
          {activeTab === 'settings' && (
             <Settings 
                user={user} 
                onUpdateProfile={handleUpdateProfile} 
                onOpenSetup={() => setShowSetup(true)} 
             />
          )}
        </div>
      </main>

    </div>
  );
};

export default App;