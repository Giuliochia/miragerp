import { NavLink } from 'react-router-dom';
import {
  Home, Swords, Package, FileText, DollarSign, Settings as SettingsIcon, LogOut, History, ClipboardCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
  { section: 'PRINCIPALE', items: [
    { path: '/', label: 'Dashboard', icon: Home, exact: true },
    { path: '/economy', label: 'Economia Mirage', icon: DollarSign },
  ]},
  { section: 'OPERATIVO', items: [
    { path: '/missions', label: 'Eventi', icon: Swords },
    { path: '/items', label: 'Drop', icon: Package },
    { path: '/documents', label: 'Documenti Drop', icon: FileText },
  ]},
  { section: 'SISTEMA', items: [
    { path: '/approvals', label: 'Approvazioni', icon: ClipboardCheck },
    { path: '/settings', label: 'Impostazioni', icon: SettingsIcon },
    { path: '/audit-log', label: 'Storico Staff', icon: History },
  ]},
];

const iconColors: Record<string, string> = {
  '/': 'text-violet-light',
  '/missions': 'text-accent-amber',
  '/items': 'text-accent-green',
  '/documents': 'text-text-secondary',
  '/economy': 'text-accent-green',
  '/approvals': 'text-violet-light',
  '/settings': 'text-text-secondary',
  '/audit-log': 'text-accent-amber',
};

export default function Sidebar() {
  const handleSignOut = () => {
    supabase?.auth.signOut();
  };

  return (
    <aside className="w-60 h-full bg-bg-card/95 border-r border-border flex flex-col overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black border border-violet-primary/40 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_0_20px_rgba(214,161,58,0.28)]">
            <img
              src="/mirage-logo.png"
              alt="Mirage RP"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="font-bold text-sm text-text-primary tracking-tight">Mirage RP</div>
            <div className="text-[10px] text-text-muted">Economy Hub</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-4">
        {navItems.map(({ section, items }) => (
          <div key={section}>
            <div className="px-3 mb-1.5 text-[9px] font-bold text-text-muted uppercase tracking-widest">{section}</div>
            <div className="space-y-0.5">
              {items.map(({ path, label, icon: Icon, exact }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-violet-primary/15 text-violet-light border-violet-primary/20'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-card2'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={16}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={isActive ? 'text-violet-light' : iconColors[path] ?? 'text-text-muted'}
                      />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
              {section === 'SISTEMA' && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-card2 transition-all duration-150 group"
                >
                  <LogOut size={16} strokeWidth={1.5} className="text-text-secondary" />
                  <span className="truncate">Esci</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
