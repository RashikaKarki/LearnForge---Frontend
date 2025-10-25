import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Error500Page from './pages/Error500Page';
import Error400Page from './pages/Error400Page';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading, error, tokenExpired, signOut } = useAuth();

  const handleLogin = () => {
    // This will be called after successful Firebase authentication
    // The authentication state is managed by the AuthContext
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Handle token expiration
  if (tokenExpired) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-deep-navy">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="h-16 w-16 bg-coral rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">Session Expired</h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                Your session has expired. Please sign in again to continue.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-coral text-white font-semibold py-3 px-6 rounded-lg hover:bg-coral/90 transition-colors duration-200 transform hover:scale-105"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;