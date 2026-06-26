import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Swords, Package, FileText, DollarSign, Settings as SettingsIcon, LogOut, History, ClipboardCheck, UsersRound, ChevronDown, ChevronRight, Folder
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { MIRAGE_PROJECT_ID } from '../../lib/project';
import { useStore } from '../../store/useStore';

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
    { path: '/administration', label: 'Amministrazione', icon: UsersRound },
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
  '/administration': 'text-violet-light',
  '/approvals': 'text-violet-light',
  '/settings': 'text-text-secondary',
  '/audit-log': 'text-accent-amber',
};

export default function Sidebar() {
  const [economyOpen, setEconomyOpen] = useState(true);
  const location = useLocation();
  const economy = useStore((s) => s.getProjectEconomy(MIRAGE_PROJECT_ID));
  const economyFolders = economy?.customFolders ?? [];
  const economyItems = economy?.customItems ?? [];
  const folderCounts = new Map<string, number>();
  economyItems.forEach((item) => {
    if (!item.folderId) return;
    folderCounts.set(item.folderId, (folderCounts.get(item.folderId) ?? 0) + 1);
  });
  const selectedEconomyFolder = new URLSearchParams(location.search).get('folder');

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
              {items.map(({ path, label, icon: Icon, exact }) => {
                const isEconomy = path === '/economy';
                return (
                  <div key={path}>
                    <div className="relative">
                      <NavLink
                        to={path}
                        end={exact}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 group ${
                            isActive
                              ? 'bg-violet-primary/15 text-violet-light border-violet-primary/20'
                              : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-card2'
                          } ${isEconomy ? 'pr-9' : ''}`
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
                      {isEconomy && (
                        <button
                          type="button"
                          onClick={() => setEconomyOpen((open) => !open)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-card2 hover:text-text-primary"
                          title={economyOpen ? 'Nascondi cartelle economia' : 'Mostra cartelle economia'}
                        >
                          {economyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>
                    {isEconomy && economyOpen && economyFolders.length > 0 && (
                      <div className="ml-6 mt-1 space-y-0.5 border-l border-border/70 pl-2">
                        {economyFolders.map((folder) => (
                          <NavLink
                            key={folder.id}
                            to={`/economy?folder=${encodeURIComponent(folder.id)}`}
                            className={() =>
                              `flex items-center gap-2 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                                location.pathname === '/economy' && selectedEconomyFolder === folder.id
                                  ? 'border-violet-primary/30 bg-violet-primary/10 text-text-primary'
                                  : 'border-transparent text-text-muted hover:bg-bg-card2 hover:text-text-primary'
                              }`
                            }
                          >
                            <Folder size={13} className="text-violet-light flex-shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                            <span className="text-[10px] text-text-muted">{folderCounts.get(folder.id) ?? 0}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
