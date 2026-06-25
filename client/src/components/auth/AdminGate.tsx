import { ReactNode, useEffect, useState } from 'react';
import { Lock, LogOut, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { getStaffAvatarUrl, getStaffName, StaffProfile } from '../../lib/staff';

interface AdminGateProps {
  children: ReactNode;
}

export default function AdminGate({ children }: AdminGateProps) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const client = supabase;

    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      const { data: userData, error: userError } = await client.auth.getUser();
      const user = userData.user;

      if (!mounted) return;

      if (userError || !user) {
        setError(userError?.message ?? 'Sessione non valida.');
        setLoading(false);
        return;
      }

      const { error: syncError } = await client.rpc('sync_mirage_staff_profile', {
        profile_email: user.email ?? null,
        profile_name: getStaffName(user),
        profile_avatar_url: getStaffAvatarUrl(user),
      });

      if (!mounted) return;

      if (syncError) {
        setError(`Permessi non configurati: ${syncError.message}`);
        setLoading(false);
        return;
      }

      const { error: bootstrapError } = await client.rpc('bootstrap_mirage_admin');

      if (!mounted) return;

      if (bootstrapError) {
        setError(`Bootstrap amministratore non disponibile: ${bootstrapError.message}`);
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await client
        .from('mirage_staff_profiles')
        .select('user_id, email, staff_name, staff_avatar_url, role, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!mounted) return;

      if (profileError) {
        setError(`Impossibile leggere il profilo staff: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setProfile((data as StaffProfile | null) ?? null);
      setLoading(false);
    };

    loadProfile();

    const { data: listener } = client.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-muted">
        Controllo permessi staff...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="card w-full max-w-lg space-y-4">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-accent-red" />
            <div>
              <h1 className="text-lg font-bold text-text-primary">Permessi non disponibili</h1>
              <p className="mt-1 text-sm text-text-muted">{error}</p>
            </div>
          </div>
          <div className="rounded-lg border border-accent-amber/30 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber">
            Esegui lo schema Supabase aggiornato prima di usare ruoli e amministrazione.
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="card w-full max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-violet-primary/15 text-violet-light">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Accesso in attesa</h1>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              Il tuo account e' registrato come utente. Un amministratore deve abilitare il ruolo amministratore per farti vedere e modificare il workspace.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-card2 px-3 py-2 text-sm text-text-secondary">
            {profile?.email ?? 'Account staff'}
          </div>
          <button type="button" className="btn-secondary w-full" onClick={() => supabase?.auth.signOut()}>
            <LogOut size={16} /> Esci
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
