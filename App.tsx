import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Error500Page from './pages/Error500Page';
import Error400Page from './pages/Error400Page';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FlashErrorProvider } from './contexts/FlashErrorContext';

function AppContent() {
  const { user, loading, error, signOut } = useAuth();

  const handleLogin = () => {
    // This will be called after successful Firebase authentication
    // The authentication state is managed by the AuthContext
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Handle error states
  if (error.type === '500') {
    return <Error500Page />;
  }

  if (error.type === '400') {
    return <Error400Page errorMessage={error.message || 'Bad Request'} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-deep-navy">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-deep-navy">
      {user ? (
        <DashboardPage onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <FlashErrorProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </FlashErrorProvider>
    </ErrorBoundary>
  );
}

export default App;