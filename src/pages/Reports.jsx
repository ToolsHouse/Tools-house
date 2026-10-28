
import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import {
  FileText,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Truck,
  ShoppingCart,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Reports = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0,
    stockValue: 0,
    profit: 0,
    customerCount: 0,
    supplierCount: 0,
    productCount: 0,
  })

  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total, paid, due')

      if (salesError) throw salesError

      const totalSales =
        sales?.reduce((sum, s) => sum + Number(s.total || 0), 0) || 0

      const totalPaid =
        sales?.reduce((sum, s) => sum + Number(s.paid || 0), 0) || 0

      const totalDue =
        sales?.reduce((sum, s) => sum + Number(s.due || 0), 0) || 0

      // Fetch purchases
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('total')

      if (purchasesError) throw purchasesError

      const totalPurchases =
        purchases?.reduce((sum, p) => sum + Number(p.total || 0), 0) || 0

      // Fetch stock value
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('quantity, buy_price')

      if (productsError) throw productsError

      const stockValue =
        products?.reduce(
          (sum, p) =>
            sum + Number(p.quantity || 0) * Number(p.buy_price || 0),
          0
        ) || 0

      // Fetch profit
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('quantity, total, products!inner(buy_price)')

      if (saleItemsError) throw saleItemsError

      const profit =
        saleItems?.reduce((sum, item) => {
          const cost =
            Number(item.quantity || 0) *
            Number(item.products?.buy_price || 0)

          return sum + (Number(item.total || 0) - cost)
        }, 0) || 0

      // Fetch counts
      const [
        { count: customerCount, error: customersError },
        { count: supplierCount, error: suppliersError },
        { count: productCount, error: productCountError },
      ] = await Promise.all([
        supabase.from('customers').select('*', {
          count: 'exact',
          head: true,
        }),
        supabase.from('suppliers').select('*', {
          count: 'exact',
          head: true,
        }),
        supabase.from('products').select('*', {
          count: 'exact',
          head: true,
        }),
      ])

      if (customersError) throw customersError
      if (suppliersError) throw suppliersError
      if (productCountError) throw productCountError

      setStats({
        totalSales,
        totalPurchases,
        totalPaid,
        totalDue,
        stockValue,
        profit,
        customerCount: customerCount || 0,
        supplierCount: supplierCount || 0,
        productCount: productCount || 0,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        التقارير العامة
      </h1>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard
          title="تقرير يومي"
          description="عرض التقرير اليومي المفصل"
          icon={FileText}
          onClick={() => navigate('/reports/daily')}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المبيعات"
          value={stats.totalSales}
          icon={TrendingUp}
          color="blue"
        />

        <StatCard
          title="إجمالي المشتريات"
          value={stats.totalPurchases}
          icon={ShoppingCart}
          color="green"
        />

        <StatCard
          title="المحصل"
          value={stats.totalPaid}
          icon={DollarSign}
          color="green"
        />

        <StatCard
          title="المستحق"
          value={stats.totalDue}
          icon={DollarSign}
          color="red"
        />

        <StatCard
          title="قيمة المخزون"
          value={stats.stockValue}
          icon={Package}
          color="purple"
        />

        <StatCard
          title="صافي الربح"
          value={stats.profit}
          icon={TrendingUp}
          color="green"
        />

        <StatCard
          title="عدد العملاء"
          value={stats.customerCount}
          icon={Users}
          color="indigo"
          isCurrency={false}
        />

        <StatCard
          title="عدد الموردين"
          value={stats.supplierCount}
          icon={Truck}
          color="teal"
          isCurrency={false}
        />
      </div>
    </div>
  )
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  isCurrency = true,
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-1">
            {isCurrency
              ? `${Number(value || 0).toFixed(2)} ج.م`
              : value}
          </p>
        </div>

        <div className={`${colorClasses[color]} p-3 rounded-full`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

const ReportCard = ({ title, description, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-right"
    >
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>

          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        </div>

        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </button>
  )
}

export default Reports

