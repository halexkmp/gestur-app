import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Sales from './components/Sales';
import Products from './components/Products';
import Buggyman from './components/Buggyman';
import Business from './components/Business';
import Reports from './components/Reports';
import StockControl from './components/StockControl';
import Users from './components/Users';
import Audit from './components/Audit';
import HR from './components/HR.tsx';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('sales');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'sales':
        return <Sales />;
      case 'products':
        return <Products />;
      case 'buggyman':
        return <Buggyman />;
      case 'business':
        return <Business />;
      case 'reports':
        return <Reports />;
      case 'stock':
        return <StockControl />;
      case 'users':
        return <Users />;
      case 'audit':
        return <Audit />;
      case 'rh':
        return <HR />;
      default:
        return <Sales />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;
