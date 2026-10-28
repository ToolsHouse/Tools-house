import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Truck,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const Layout = () => {
  const { signOut, user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const navigation = [
    { name: 'الرئيسية', href: '/', icon: LayoutDashboard },
    { name: 'المنتجات', href: '/products', icon: Package },
    { name: 'العملاء', href: '/customers', icon: Users },
    { name: 'المبيعات', href: '/sales', icon: ShoppingCart },
    { name: 'الموردين', href: '/suppliers', icon: Truck },
    { name: 'المشتريات', href: '/purchases', icon: ShoppingCart },
    { name: 'المصروفات', href: '/expenses', icon: Wallet },
    { name: 'التقارير', href: '/reports', icon: FileText },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white tracking-wide">TOOLS HOUSE</h1>
        </div>

        <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white transition-colors'
                } group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  } ml-3 flex-shrink-0 h-5 w-5 transition-colors`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="ml-3 h-5 w-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />

          {/* User menu - Desktop only */}
          <div className="hidden lg:flex items-center">
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {profile?.username || user?.email?.split('@')[0] || 'المستخدم'}
                    </p>
                    <p className="text-xs text-gray-500">مسؤول النظام</p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 ring-1 ring-gray-200 z-50 border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {profile?.username || user?.email?.split('@')[0] || 'المستخدم'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="ml-2 h-4 w-4 text-gray-400" />
                    الإعدادات
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setUserMenuOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
