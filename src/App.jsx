import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import CustomerStatement from './pages/CustomerStatement'
import Sales from './pages/Sales'
import SaleDetails from './pages/SaleDetails'
import CreateSale from './pages/CreateSale'
import Suppliers from './pages/Suppliers'
import SupplierStatement from './pages/SupplierStatement'
import Purchases from './pages/Purchases'
import CreatePurchase from './pages/CreatePurchase'
import PurchaseDetails from './pages/PurchaseDetails'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import DailyReport from './pages/DailyReport'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return children
}

function App() {
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleError = (event) => {
      console.error('Application error:', event.error)
      setError(event.error?.message || 'حدث خطأ في التطبيق')
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في التطبيق</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">يرجى تحديث الصفحة أو تواصل مع الدعم الفني</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة تحميل
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id/statement" element={<CustomerStatement />} />
            <Route path="sales" element={<Sales />} />
            <Route path="sales/create" element={<CreateSale />} />
            <Route path="sales/:id" element={<SaleDetails />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/:id/statement" element={<SupplierStatement />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/create" element={<CreatePurchase />} />
            <Route path="purchases/:id" element={<PurchaseDetails />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/daily" element={<DailyReport />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
