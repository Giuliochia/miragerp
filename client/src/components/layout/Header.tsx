import { useEffect, useState } from 'react';
import { Search, UserRound } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/missions': 'Eventi',
  '/items': 'Drop',
  '/documents': 'Documenti Drop',
  '/economy': 'Economia Mirage',
  '/settings': 'Impostazioni',
  '/audit-log': 'Storico Staff',
  '/approvals': 'Centro Approvazioni',
};

interface HeaderProps {
  onSearchOpen?: () => void;
}

function getStaffName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return String(
    metadata?.full_name
    ?? metadata?.name
    ?? metadata?.global_name
    ?? metadata?.user_name
    ?? metadata?.preferred_username
    ?? user.email
    ?? 'Staff'
  );
}

function getStaffAvatarUrl(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const value = metadata?.avatar_url ?? metadata?.picture ?? metadata?.avatar;
  return typeof value === 'string' && value.length > 0 ? value : '';
}

export default function Header({ onSearchOpen }: HeaderProps) {
  const location = useLocation();
  const label = routeLabels[location.pathname] ?? 'Mirage RP';
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const staffName = user ? getStaffName(user) : 'Staff';
  const staffAvatar = user ? getStaffAvatarUrl(user) : '';

  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-5 bg-bg-primary/80 backdrop-blur-sm flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-text-primary truncate">{label}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-card2 rounded-lg transition-colors"
          >
            <Search size={16} />
          </button>
        )}
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-card2/70 px-2.5 py-1.5 shadow-[0_0_18px_rgba(214,161,58,0.08)]">
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-violet-primary/35 bg-bg-primary">
              {staffAvatar ? (
                <img src={staffAvatar} alt={staffName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-text-muted">
                  <UserRound size={16} />
                </div>
              )}
            </div>
            <div className="min-w-0 text-right">
              <div className="max-w-36 truncate text-xs font-semibold text-text-primary">{staffName}</div>
              <div className="max-w-36 truncate text-[10px] text-text-muted">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
