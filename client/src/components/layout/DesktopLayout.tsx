import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DesktopLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
}

export default function DesktopLayout({ children, rightPanel }: DesktopLayoutProps) {
  return (
    <div className="flex h-screen-safe min-w-[1180px] bg-gradient-rp overflow-hidden">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>

          {/* Optional right panel */}
          {rightPanel && (
            <aside className="w-72 xl:w-80 border-l border-border overflow-y-auto p-4 scrollbar-hide flex-shrink-0">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
