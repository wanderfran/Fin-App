import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { User } from './types';
import { LoginScreen } from './components/Auth';
import { SetupScreen } from './components/SetupScreen';
import { Settings } from './components/Settings';
import { Logo } from './components/Logo';
import { Pentagon, BarChart3, Wallet, User as UserIcon, LayoutGrid, ListMinus, Receipt, Target, Settings as SettingsIcon, Bell, Loader2, LogOut, Plus } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Bills } from './components/Bills';
import { Goals } from './components/Goals';
import { AddTransactionModal } from './components/AddTransactionModal';
import { supabase, hasValidKey } from './supabaseClient';

type Tab = 'dashboard' | 'transactions' | 'bills' | 'settings';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  
  // Auth Session Management
  useEffect(() => {
    if (!hasValidKey) {
      setSessionLoading(false);
      return;
    }

    const initSession = async () => {
        // Verifica hash na URL para recuperação de senha (fallback)
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
            setIsRecovery(true);
            // setActiveTab('settings'); // Será definido no auth state change
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const userData: User = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0]
            };
            
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, phone, avatar_url')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    if (profile.display_name) userData.name = profile.display_name;
                    if (profile.phone) userData.phone = profile.phone;
                    if (profile.avatar_url) userData.avatar_url = profile.avatar_url;
                }
            } catch (e) {
                console.error("Erro ao buscar perfil:", e);
            }

            setUser(userData);
            
            // Se detectamos recovery, forçamos a aba de settings
            if (hash && hash.includes('type=recovery')) {
                 setActiveTab('settings');
                 // Opcional: Limpar o hash da URL para ficar bonito
                 window.history.replaceState(null, '', window.location.pathname);
            }
        }
        setSessionLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
        setActiveTab('settings');
      }

      if (session?.user) {
         // Re-fetch profile on auth change to ensure we have latest data
         const fetchProfile = async () => {
             const { data: profile } = await supabase
                .from('profiles')
                .select('display_name, phone, avatar_url')
                .eq('id', session.user.id)
                .single();
             
             setUser({
                id: session.user.id,
                email: session.user.email!,
                name: profile?.display_name || session.user.email!.split('@')[0],
                phone: profile?.phone,
                avatar_url: profile?.avatar_url
             });
         };
         fetchProfile();
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Quando o usuário muda, reseta o estado de erro da imagem
  useEffect(() => {
      setImgError(false);
  }, [user?.avatar_url]);

  const handleLogin = (u: User) => {
    setUser(u);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveTab('dashboard');
    setIsRecovery(false);
  };

  const handleUpdateProfile = (newName: string, newPhone?: string, newAvatar?: string) => {
      setUser(prev => {
          if (!prev) return null;
          return {
              ...prev,
              name: newName,
              phone: newPhone,
              avatar_url: newAvatar || prev.avatar_url
          };
      });
  };

  const { 
    transactions, bills, goals, loading: dataLoading,
    addTransaction, deleteTransaction, 
    addBill, toggleBillPaid, 
    addGoal, updateGoalProgress 
  } = useStore(user?.id || '');

  // Navigation Item Component - Mobile (Replica High Fidelity)
  const NavItem = ({ tab, icon: Icon, filledIcon }: { tab: Tab, icon: any, filledIcon?: boolean }) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className="flex items-center justify-center relative w-12 h-12"
      >
        {isActive && (
            <div className="absolute inset-0 m-auto w-10 h-10 bg-[#2A3530] rounded-full opacity-100 transition-all duration-300"></div>
        )}
        <Icon 
            size={22} 
            strokeWidth={isActive ? (filledIcon ? 0 : 2.5) : 2}
            className={`relative z-10 transition-colors duration-300 ${
                isActive ? 'text-[#ccff00] fill-[#ccff00]' : 'text-[#5a6b61]'
            } ${filledIcon && isActive ? 'fill-[#ccff00] text-[#ccff00]' : ''}`} 
        />
      </button>
    );
  };

  // Desktop Nav Item
  const DesktopNavItem = ({ tab, icon: Icon, label }: { tab: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-4 w-full px-4 py-3 rounded-2xl transition-all duration-200 group ${
        activeTab === tab 
          ? 'bg-[#ccff00] text-black font-semibold' 
          : 'text-[#88998C] hover:bg-[#1A221B] hover:text-white'
      }`}
    >
      <Icon size={20} strokeWidth={activeTab === tab ? 2.5 : 1.5} className="transition-transform group-hover:scale-105" />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );

  if (showSetup) return <SetupScreen onCancel={() => setShowSetup(false)} />;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0b100d] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#ccff00]" size={32} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onOpenSetup={() => setShowSetup(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b100d] text-[#f0f2f0] font-sans selection:bg-[#ccff00] selection:text-black animate-in fade-in duration-700">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0F1612] border-r border-[#1F2923] p-6 fixed h-full z-10">
        <div className="mb-10 pl-2">
          <Logo className="h-8 w-auto" textColor="#ccff00" />
        </div>
        
        <nav className="space-y-1 flex-1">
          <DesktopNavItem tab="dashboard" icon={LayoutGrid} label="Visão Geral" />
          <DesktopNavItem tab="transactions" icon={BarChart3} label="Transações" />
          <DesktopNavItem tab="bills" icon={Wallet} label="Carteira" />
          <DesktopNavItem tab="settings" icon={UserIcon} label="Perfil" />
        </nav>

        {/* Desktop Add Button */}
        <button
            onClick={() => setIsAddModalOpen(true)}
            className="mb-6 w-full py-3 bg-[#ccff00] hover:bg-[#b3ff66] text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
            <Plus size={20} strokeWidth={2.5} />
            Nova Transação
        </button>

        <div className="mt-auto pt-6 border-t border-[#1F2923] space-y-2">
           <div className="flex items-center gap-3 p-3 mt-4 rounded-2xl bg-[#161d19] border border-[#1F2923]">
            <div className="w-8 h-8 rounded-full bg-[#ccff00] flex items-center justify-center text-black font-bold text-xs overflow-hidden">
                {!imgError && user.avatar_url ? (
                    <img 
                        key={user.avatar_url} 
                        src={user.avatar_url} 
                        alt="User" 
                        className="w-full h-full object-cover" 
                        onError={() => setImgError(true)}
                    />
                ) : (
                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                    {user.name || 'Usuário'}
                </p>
                <button onClick={handleLogout} className="text-[10px] text-[#5a6b61] hover:text-red-400 transition-colors flex items-center gap-1">
                   Sair
                </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header - Reference Design */}
      <div className="lg:hidden fixed top-0 w-full bg-[#0b100d] z-20 px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-full bg-[#1F2923] border border-[#2A3530] flex items-center justify-center overflow-hidden">
                {!imgError && user.avatar_url ? (
                    <img 
                        key={user.avatar_url} 
                        src={user.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)} 
                    />
                ) : (
                    <span className="text-white font-bold text-lg">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </span>
                )}
            </div>
            
            {/* Greeting Text */}
            <div className="flex flex-col justify-center">
                <span className="text-[#88998C] text-xs font-medium leading-tight">Sua carteira</span>
                <span className="text-white text-lg font-semibold leading-tight tracking-tight">
                    Olá, {user.name?.split(' ')[0] || 'Visitante'}
                </span>
            </div>
        </div>

        {/* Notification Bell */}
        <button className="w-10 h-10 rounded-full bg-[#161d19] border border-[#2A3530] flex items-center justify-center text-white hover:bg-[#2A3530] transition-colors shadow-lg">
            <Bell size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-10 pt-32 lg:pt-10 overflow-y-auto min-h-screen pb-32 lg:pb-10 relative">
        <div className="max-w-5xl mx-auto">
          {dataLoading && activeTab !== 'settings' && (
             <div className="mb-6 flex items-center justify-center gap-2 text-[#ccff00] py-2 animate-pulse opacity-70">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-medium tracking-widest uppercase">Sincronizando</span>
             </div>
          )}
          {activeTab === 'dashboard' && <Dashboard transactions={transactions} bills={bills} goals={goals} />}
          {activeTab === 'transactions' && <Transactions data={transactions} onAdd={addTransaction} onDelete={deleteTransaction} onOpenAdd={() => setIsAddModalOpen(true)} />}
          {activeTab === 'bills' && <Bills bills={bills} onAdd={addBill} onPay={toggleBillPaid} />}
          {activeTab === 'settings' && (
             <Settings 
                user={user} 
                onUpdateProfile={handleUpdateProfile} 
                onOpenSetup={() => setShowSetup(true)} 
                isRecovery={isRecovery}
             />
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={addTransaction} 
      />

      {/* Mobile Bottom Navigation (Replica High Fidelity - Button Centered) */}
      <div className="lg:hidden fixed bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="bg-[#121212] backdrop-blur-md border border-[#2A3530]/80 rounded-[2.5rem] px-2 py-2 shadow-2xl shadow-black/90 flex items-center justify-between w-full max-w-xs pointer-events-auto">
            
            {/* Left Group */}
            <div className="flex items-center gap-1 pl-2">
                <NavItem tab="dashboard" icon={Pentagon} filledIcon={true} />
                <NavItem tab="transactions" icon={BarChart3} />
            </div>

            {/* Center Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-14 h-14 bg-[#ccff00] rounded-full flex items-center justify-center text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 mx-2"
            >
                <Plus size={28} strokeWidth={2.5} />
            </button>

            {/* Right Group */}
            <div className="flex items-center gap-1 pr-2">
                <NavItem tab="bills" icon={Wallet} />
                <NavItem tab="settings" icon={UserIcon} />
            </div>

        </div>
      </div>

    </div>
  );
};

export default App;