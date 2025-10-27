// src/components/layout/Layout.tsx (Atualizado)
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet /> {/* As páginas (Products, Users, etc.) serão renderizadas aqui */}
        </main>
      </div>
    </div>
  );
}