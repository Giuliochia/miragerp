import { ReactNode, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface AuthGateProps {
  children: ReactNode;
}

function DiscordLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M20.3 4.4A19.7 19.7 0 0 0 15.4 3l-.2.4c-.2.4-.4.9-.6 1.3a18.4 18.4 0 0 0-5.2 0 9.2 9.2 0 0 0-.8-1.7 19.5 19.5 0 0 0-4.9 1.5C.6 9.1-.2 13.6.2 18a19.8 19.8 0 0 0 6 3c.5-.7.9-1.4 1.2-2.1-.7-.3-1.3-.6-1.9-.9l.5-.4a14 14 0 0 0 12 0l.5.4c-.6.4-1.2.7-1.9.9.3.7.7 1.4 1.2 2.1a19.8 19.8 0 0 0 6-3c.5-5.1-.8-9.5-3.5-13.6ZM8 15.3c-1.2 0-2.1-1.1-2.1-2.4S6.8 10.5 8 10.5s2.1 1.1 2.1 2.4S9.2 15.3 8 15.3Zm8 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.1 1.1 2.1 2.4-.9 2.4-2.1 2.4Z"
      />
    </svg>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setLoading(false);
  };

  const signUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      setMessage('Registrazione completata. Sei entrato nel workspace.');
    } else {
      setMessage('Registrazione inviata. Controlla la mail per confermare l account, poi torna qui e accedi.');
      setMode('login');
    }
    setLoading(false);
  };

  const signInWithDiscord = async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    setMessage('');
    const { error: discordError } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (discordError) {
      setError(discordError.message);
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center text-text-muted">
        Connessione allo staff workspace...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <form onSubmit={mode === 'login' ? signIn : signUp} className="card w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-violet-light" />
            <div>
              <h1 className="text-lg font-bold text-text-primary">Mirage RP Staff</h1>
              <p className="text-xs text-text-muted mt-1">
                {mode === 'login' ? 'Accedi per lavorare sul workspace condiviso.' : 'Crea il tuo account staff per accedere al workspace.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-bg-card2 border border-border rounded-lg p-1">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className={`py-2 rounded-md text-sm font-semibold ${mode === 'login' ? 'bg-violet-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setMessage(''); }}
              className={`py-2 rounded-md text-sm font-semibold ${mode === 'register' ? 'bg-violet-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              Registrati
            </button>
          </div>

          <button type="button" onClick={signInWithDiscord} className="btn-secondary w-full justify-center gap-2" disabled={loading}>
            <DiscordLogo />
            Continua con Discord
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-[10px] uppercase tracking-wider text-text-muted">oppure</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="text-sm text-accent-red bg-accent-red/10 border border-accent-red/30 rounded-lg px-3 py-2">{error}</div>}
          {message && <div className="text-sm text-accent-green bg-accent-green/10 border border-accent-green/30 rounded-lg px-3 py-2">{message}</div>}

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Attendi...' : mode === 'login' ? 'Entra' : 'Crea account'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
