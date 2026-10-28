import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency, formatCount } from '../utils/format'

const Dashboard = () => {
  const [stats, setStats] = useState({
    salesToday: 0,
    paidToday: 0,
    creditToday: 0,
    customerCount: 0,
    productCount: 0,
    supplierCount: 0,
    lowStockCount: 0,
    totalDue: 0,
    totalSupplierDue: 0,
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Fetch today's sales
      const { data: salesToday } = await supabase
        .from('sales')
        .select('total, paid, due')
        .gte('created_at', today)

      const salesTotal = salesToday?.reduce((sum, s) => sum + parseFloat(s.total || 0), 0) || 0
      const paidTotal = salesToday?.reduce((sum, s) => sum + parseFloat(s.paid || 0), 0) || 0
      const creditTotal = salesToday?.reduce((sum, s) => sum + parseFloat(s.due || 0), 0) || 0

      // Fetch counts
      const [{ count: customerCount }, { count: productCount }, { count: supplierCount }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('suppliers').select('*', { count: 'exact', head: true }),
      ])

      // Fetch low stock products
      const { data: lowStock } = await supabase
        .from('products')
        .select('*')
        .lte('quantity', 'minimum_quantity')
        .order('quantity', { ascending: true })
        .limit(8)

      // Fetch total customer dues
      const { data: allSales } = await supabase.from('sales').select('due')
      const totalDue = allSales?.reduce((sum, s) => sum + parseFloat(s.due || 0), 0) || 0

      // Fetch total supplier dues
      const { data: allPurchases } = await supabase.from('purchases').select('due')
      const totalSupplierDue = allPurchases?.reduce((sum, p) => sum + parseFloat(p.due || 0), 0) || 0

      // Fetch recent sales
      const { data: recent } = await supabase
        .from('sales')
        .select(`
          *,
          customers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(8)

      setStats({
        salesToday: salesTotal,
        paidToday: paidTotal,
        creditToday: creditTotal,
        customerCount: customerCount || 0,
        productCount: productCount || 0,
        supplierCount: supplierCount || 0,
        lowStockCount: lowStock?.length || 0,
        totalDue,
        totalSupplierDue,
      })

      setLowStockProducts(lowStock || [])
      setRecentSales(recent || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Still set loading to false even if there's an error
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="مبيعات اليوم"
          value={stats.salesToday}
          icon={TrendingUp}
          color="blue"
          isCurrency={true}
        />
        <StatCard
          title="المحصل اليوم"
          value={stats.paidToday}
          icon={DollarSign}
          color="green"
          isCurrency={true}
        />
        <StatCard
          title="آجل اليوم"
          value={stats.creditToday}
          icon={ShoppingCart}
          color="orange"
          isCurrency={true}
        />
        <StatCard
          title="العملاء"
          value={stats.customerCount}
          icon={Users}
          color="purple"
          isCurrency={false}
        />
        <StatCard
          title="المنتجات"
          value={stats.productCount}
          icon={Package}
          color="indigo"
          isCurrency={false}
        />
        <StatCard
          title="الموردين"
          value={stats.supplierCount}
          icon={Truck}
          color="teal"
          isCurrency={false}
        />
        <StatCard
          title="منتجات منخفضة"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          color="red"
          isCurrency={false}
        />
        <StatCard
          title="إجمالي المستحق للعملاء"
          value={stats.totalDue}
          icon={DollarSign}
          color="yellow"
          isCurrency={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
            <AlertTriangle className="ml-2 h-5 w-5 text-red-500" />
            منتجات منخفضة المخزون
          </h2>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد منتجات منخفضة المخزون</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">{product.name}</span>
                  <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">{product.quantity} قطعة</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">آخر المبيعات</h2>
          {recentSales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد مبيعات</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {sale.customers?.name || 'عميل نقدي'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(sale.created_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ title, value, icon: Icon, color, isCurrency = true }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  }

  const displayValue = isCurrency ? formatCurrency(value) : formatCount(value)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {displayValue}
          </p>
        </div>
        <div className={`bg-gradient-to-br ${colorClasses[color]} p-3 rounded-xl shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
