import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DesktopLayout from './components/layout/DesktopLayout';

// Eager-loaded pages (above the fold)
import Dashboard from './pages/Dashboard';

// Lazy-loaded pages
const Missions = lazy(() => import('./pages/Missions'));
const Items = lazy(() => import('./pages/Items'));
const Documents = lazy(() => import('./pages/Documents'));
const Economy = lazy(() => import('./pages/Economy'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Administration = lazy(() => import('./pages/Administration'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-violet-primary animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DesktopLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/ai" element={<Navigate to="/economy" replace />} />
            <Route path="/codex" element={<Navigate to="/documents" replace />} />
            <Route path="/factions" element={<Navigate to="/economy" replace />} />
            <Route path="/npcs" element={<Navigate to="/economy" replace />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/items" element={<Items />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/economy" element={<Economy />} />
            <Route path="/legal-illegal" element={<Navigate to="/economy" replace />} />
            <Route path="/timeline" element={<Navigate to="/missions" replace />} />
            <Route path="/relations" element={<Navigate to="/documents" replace />} />
            <Route path="/coherence" element={<Navigate to="/economy" replace />} />
            <Route path="/abuse" element={<Navigate to="/economy" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/administrator" element={<Administration />} />
          </Routes>
        </Suspense>
      </DesktopLayout>
    </BrowserRouter>
  );
}
