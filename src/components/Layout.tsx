import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  Box,
  UserCog,
  Clock
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut, isAdmin, isSuperAdmin, isHR, isEmployee } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'sales', label: 'Nova Venda', icon: ShoppingCart, adminOnly: false },
    { id: 'products', label: 'Produtos', icon: Package, adminOnly: true },
    { id: 'buggyman', label: 'Bugueiros', icon: Users, adminOnly: true },
    { id: 'business', label: 'Empresas Parceiras', icon: Building2, adminOnly: true },
    { id: 'stock', label: 'Controle de Estoque', icon: Box, adminOnly: false },
    { id: 'reports', label: 'Relatórios', icon: TrendingUp, adminOnly: false },
    { id: 'rh', label: 'Recursos Humanos', icon: Users, adminOnly: false },
    { id: 'journey', label: 'Minha Jornada', icon: Clock, adminOnly: false },
    { id: 'users', label: 'Usuários', icon: UserCog, adminOnly: false }, // Removed adminOnly to handle manually
    { id: 'audit', label: 'Auditoria', icon: FileText, adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Specific rule: If user is ONLY an employee, they only see the journey menu
    if (isEmployee && user?.roles.length === 1) {
      return item.id === 'journey';
    }

    if (item.id === 'rh') return isSuperAdmin || isHR;
    if (item.id === 'users') return isSuperAdmin;
    if (item.id === 'journey') return isEmployee;
    return !item.adminOnly || isAdmin;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Gestur</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 w-64`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">BeachDunnas</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
        </div>

        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-6">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
