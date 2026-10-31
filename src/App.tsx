import { useAuth } from './hooks/useAuth';
import { useVault } from './hooks/useVault';
import { useMediaQuery } from './hooks/useMediaQuery';
import { AuthScreen } from './components/auth/AuthScreen';
import { MobileLayout } from './layouts/MobileLayout';
import { DesktopLayout } from './layouts/DesktopLayout';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const vault = useVault(user);

  if (loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[var(--bg)] text-[var(--muted)] text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return isDesktop ? (
    <DesktopLayout vault={vault} user={user} onSignOut={signOut} />
  ) : (
    <MobileLayout vault={vault} user={user} onSignOut={signOut} />
  );
}
