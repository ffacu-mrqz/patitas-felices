'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import {
  PawPrint,
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Turnos y Citas', href: '/dashboard/turnos', icon: Calendar },
    { name: 'Pacientes / Mascotas', href: '/dashboard/pacientes', icon: Users },
    { name: 'Historial Clínico', href: '/dashboard/historial', icon: FileText },
    { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  ]

  return (
    <div className="dashboard-container">
      {/* Fondo dinámico animado */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />
      <div className="bg-grid" />

      {/* Sidebar para Escritorio y Móvil */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <PawPrint size={28} color="#4ade80" className="paw-icon" />
          </div>
          <span className="brand-title">Patitas Felices</span>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>

        <nav className="nav-menu">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} className="nav-icon" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay para cerrar sidebar en móviles */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Contenido Principal */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} color="#f8fafc" />
          </button>

          <div className="search-box">
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Buscar pacientes, dueños o turnos..."
              className="search-input"
            />
          </div>

          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} color="#cbd5e1" />
              <span className="badge" />
            </button>
            <div className="user-avatar">
              <span>Vet</span>
            </div>
          </div>
        </header>

        <main className="content-area">{children}</main>
      </div>

      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background-color: #0b0f19;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #f8fafc;
          display: flex;
          position: relative;
          overflow-x: hidden;
        }

        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.45;
          pointer-events: none;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: #059669;
          top: -100px;
          left: -100px;
          animation: floatOrb1 16s ease-in-out infinite alternate;
        }

        .orb-2 {
          width: 450px;
          height: 450px;
          background: #0284c7;
          bottom: -100px;
          right: -100px;
          animation: floatOrb2 20s ease-in-out infinite alternate;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: #10b981;
          top: 50%;
          left: 40%;
          transform: translate(-50%, -50%);
          animation: floatOrb3 14s ease-in-out infinite alternate;
        }

        /* Sidebar Glassmorphic */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 260px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 50;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding: 0 8px;
        }

        .logo-box {
          width: 42px;
          height: 42px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-title {
          font-size: 18px;
          font-weight: 800;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }

        .close-btn {
          display: none;
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        :global(.nav-link) {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        :global(.nav-link:hover) {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        :global(.nav-link.active) {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 16px;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(248, 113, 113, 0.2);
          border-radius: 12px;
          color: #f87171;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-2px);
        }

        /* Topbar & Main Layout */
        .main-wrapper {
          flex: 1;
          margin-left: 260px;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          z-index: 10;
        }

        .topbar {
          height: 70px;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 16px;
          width: 320px;
          transition: all 0.2s ease;
        }

        .search-box:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .search-input {
          background: none;
          border: none;
          outline: none;
          color: #f8fafc;
          font-size: 13px;
          width: 100%;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-btn {
          position: relative;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #0284c7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #ffffff;
        }

        .content-area {
          padding: 32px;
          flex: 1;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .close-btn {
            display: block;
          }
          .sidebar-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 45;
          }
          .main-wrapper {
            margin-left: 0;
          }
          .menu-btn {
            display: block;
          }
          .search-box {
            width: 200px;
          }
        }

        @keyframes floatOrb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, -40px) scale(1.15); }
        }
        @keyframes floatOrb3 {
          0% { transform: translate(-50%, -50%) scale(0.9); }
          100% { transform: translate(-40%, -60%) scale(1.1); }
        }
      `}</style>
    </div>
  )
}