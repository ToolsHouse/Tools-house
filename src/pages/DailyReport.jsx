import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { ArrowRight, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const DailyReport = () => {
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState({
    sales: [],
    customerPayments: [],
    expenses: [],
  })
  const [stats, setStats] = useState({
    totalSales: 0,
    cashCollectedFromSales: 0,
    cashCollectedFromPayments: 0,
    totalCashCollected: 0,
    newCreditSales: 0,
    numberOfSales: 0,
    totalQuantitySold: 0,
    costOfGoodsSold: 0,
    grossProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReportData()
  }, [fromDate, toDate])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const dateRange = [fromDate, toDate]

      // Fetch sales
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          *,
          customers (name),
          sale_items (
            *,
            products (name, buy_price)
          )
        `)
        .gte('created_at', fromDate)
        .lte('created_at', toDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      // Fetch customer payments
      const { data: customerPayments } = await supabase
        .from('customer_payments')
        .select('*, customers (name)')
        .gte('created_at', fromDate)
        .lte('created_at', toDate + 'T23:59:59')
        .order('created_at', { ascending: false })

      // Fetch expenses (excluding purchase payments)
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('expense_date', fromDate)
        .lte('expense_date', toDate)
        .order('expense_date', { ascending: false })

      // Calculate stats
      const totalSales = sales?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0
      const cashCollectedFromSales = sales?.reduce((sum, s) => sum + parseFloat(s.paid), 0) || 0
      const cashCollectedFromPayments = customerPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
      const totalCashCollected = cashCollectedFromSales + cashCollectedFromPayments
      const newCreditSales = sales?.reduce((sum, s) => sum + parseFloat(s.due), 0) || 0
      const numberOfSales = sales?.length || 0
      const totalQuantitySold = sales?.reduce((sum, s) => sum + s.sale_items.reduce((is, item) => is + item.quantity, 0), 0) || 0
      const costOfGoodsSold = sales?.reduce((sum, s) => {
        return sum + s.sale_items.reduce((is, item) => {
          return is + (item.quantity * parseFloat(item.products.buy_price))
        }, 0)
      }, 0) || 0
      const grossProfit = totalSales - costOfGoodsSold
      const totalExpenses = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0
      const netProfit = grossProfit - totalExpenses

      setStats({
        totalSales,
        cashCollectedFromSales,
        cashCollectedFromPayments,
        totalCashCollected,
        newCreditSales,
        numberOfSales,
        totalQuantitySold,
        costOfGoodsSold,
        grossProfit,
        totalExpenses,
        netProfit,
      })

      setData({
        sales: sales || [],
        customerPayments: customerPayments || [],
        expenses: expenses || [],
      })
    } catch (error) {
      console.error('Error fetching daily report:', error)
    } finally {
      setLoading(false)
    }
  }

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setFromDate(today)
    setToDate(today)
  }

  const setYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const date = yesterday.toISOString().split('T')[0]
    setFromDate(date)
    setToDate(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          العودة للتقارير
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">التقرير اليومي</h1>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              من تاريخ
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={setToday}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            اليوم
          </button>
          <button
            onClick={setYesterday}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            أمس
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">جاري التحميل...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="إجمالي المبيعات"
              value={stats.totalSales}
              color="blue"
            />
            <SummaryCard
              title="المحصل (مبيعات + مدفوعات)"
              value={stats.totalCashCollected}
              color="green"
            />
            <SummaryCard
              title="آجل جديد"
              value={stats.newCreditSales}
              color="orange"
            />
            <SummaryCard
              title="عدد الفواتير"
              value={stats.numberOfSales}
              color="purple"
              isNumber
            />
            <SummaryCard
              title="الكمية المباعة"
              value={stats.totalQuantitySold}
              color="indigo"
              isNumber
            />
            <SummaryCard
              title="تكلفة البضاعة المباعة"
              value={stats.costOfGoodsSold}
              color="gray"
            />
            <SummaryCard
              title="صافي الربح"
              value={stats.grossProfit}
              color="green"
            />
            <SummaryCard
              title="المصروفات"
              value={stats.totalExpenses}
              color="red"
            />
          </div>

          {/* Final Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">الملخص النهائي</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>صافي الدخل (المحصل - المصروفات):</span>
                <span className="font-bold">
                  {(stats.totalCashCollected - stats.totalExpenses).toFixed(2)} ج.م
                </span>
              </div>
              <div className="flex justify-between text-xl border-t pt-2">
                <span>صافي الربح (الربح - المصروفات):</span>
                <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.netProfit.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Sales Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">تفاصيل المبيعات</h2>
            {data.sales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد مبيعات في هذه الفترة</p>
            ) : (
              <div className="space-y-3">
                {data.sales.map((sale) => (
                  <div key={sale.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">
                          {sale.customers?.name || 'عميل نقدي'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{parseFloat(sale.total).toFixed(2)} ج.م</p>
                        <p className="text-sm text-green-600">
                          مدفوع: {parseFloat(sale.paid).toFixed(2)} ج.م
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {sale.sale_items.map((item) => (
                        <span key={item.id} className="ml-2">
                          {item.products.name} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Payments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">تحصيل الديون القديمة</h2>
            {data.customerPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد مدفوعات في هذه الفترة</p>
            ) : (
              <div className="space-y-2">
                {data.customerPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <div>
                      <p className="font-medium">{payment.customers?.name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">
                      {parseFloat(payment.amount).toFixed(2)} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">المصروفات</h2>
            {data.expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">لا توجد مصروفات في هذه الفترة</p>
            ) : (
              <div className="space-y-2">
                {data.expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category} - {expense.expense_date}
                      </p>
                    </div>
                    <span className="font-bold text-red-600">
                      {parseFloat(expense.amount).toFixed(2)} ج.م
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

const SummaryCard = ({ title, value, color, isNumber = false }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    gray: 'bg-gray-500',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">
        {isNumber ? value : value.toFixed(2)} {isNumber ? '' : 'ج.م'}
      </p>
    </div>
  )
}

export default DailyReport
