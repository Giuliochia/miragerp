import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { StaffProfile, StaffRole } from '../lib/staff';

export default function Administration() {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const admins = useMemo(() => profiles.filter((profile) => profile.role === 'admin'), [profiles]);
  const users = useMemo(() => profiles.filter((profile) => profile.role === 'user'), [profiles]);

  const loadProfiles = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    setCurrentUserId(userData.user?.id ?? '');

    const { data, error: listError } = await supabase
      .from('mirage_staff_profiles')
      .select('user_id, email, staff_name, staff_avatar_url, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (listError) {
      setError(listError.message);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as StaffProfile[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const updateRole = async (profile: StaffProfile, role: StaffRole) => {
    if (!supabase) return;
    if (profile.user_id === currentUserId && role !== 'admin') return;

    setSavingId(profile.user_id);
    setError('');

    const { error: updateError } = await supabase
      .from('mirage_staff_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', profile.user_id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProfiles((current) => current.map((entry) => (
        entry.user_id === profile.user_id ? { ...entry, role, updated_at: new Date().toISOString() } : entry
      )));
    }

    setSavingId('');
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 pt-5 pb-4">
        <div className="card text-sm text-text-muted">
          Supabase non configurato: la gestione utenti richiede autenticazione e database remoto.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-4 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <UsersRound size={18} className="text-violet-light" />
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Controllo accessi</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Amministrazione</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gestisci gli utenti registrati e abilita il ruolo amministratore.
          </p>
        </div>
        <button type="button" className="btn-secondary text-sm" onClick={loadProfiles} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Aggiorna
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Utenti registrati</div>
          <div className="mt-2 text-3xl font-bold text-text-primary">{profiles.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Amministratori</div>
          <div className="mt-2 text-3xl font-bold text-violet-light">{admins.length}</div>
        </div>
        <div className="card">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted">In attesa</div>
          <div className="mt-2 text-3xl font-bold text-accent-amber">{users.length}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">Utenti staff</div>
            <p className="mt-1 text-xs text-text-muted">I nuovi registrati partono come utenti e non vedono il workspace.</p>
          </div>
          <span className="badge-violet">{profiles.length}</span>
        </div>

        {profiles.length === 0 && !loading ? (
          <div className="rounded-lg border border-border bg-bg-card2 p-4 text-sm text-text-muted">
            Nessun utente trovato.
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => {
              const isAdmin = profile.role === 'admin';
              const isCurrentUser = profile.user_id === currentUserId;
              return (
                <div key={profile.user_id} className="rounded-lg border border-border bg-bg-card2 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-violet-primary/35 bg-bg-primary">
                        {profile.staff_avatar_url ? (
                          <img src={profile.staff_avatar_url} alt={profile.staff_name ?? 'Staff'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserRound size={18} className="text-text-muted" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-bold text-text-primary">
                            {profile.staff_name || profile.email || 'Staff'}
                          </div>
                          {isCurrentUser && <span className="badge-gray text-[10px]">Tu</span>}
                          <span className={`${isAdmin ? 'badge-violet' : 'badge-gray'} text-[10px]`}>
                            {isAdmin ? 'Amministratore' : 'Utente'}
                          </span>
                        </div>
                        <div className="mt-1 truncate text-xs text-text-muted">{profile.email ?? 'Email non disponibile'}</div>
                      </div>
                    </div>

                    <label className="flex flex-shrink-0 items-center gap-3 rounded-lg border border-border bg-bg-card px-3 py-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#D6A13A]"
                        checked={isAdmin}
                        disabled={savingId === profile.user_id || isCurrentUser}
                        onChange={(event) => updateRole(profile, event.target.checked ? 'admin' : 'user')}
                      />
                      <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                        <ShieldCheck size={15} className={isAdmin ? 'text-violet-light' : 'text-text-muted'} />
                        Amministratore
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
