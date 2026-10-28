import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import { ArrowRight, Package, DollarSign, Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'

const CustomerStatement = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [sales, setSales] = useState([])
  const [payments, setPayments] = useState([])
  const [productSummary, setProductSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    fetchCustomerData()
  }, [id])

  const fetchCustomerData = async () => {
    try {
      // Fetch customer
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (customerData) setCustomer(customerData)

      // Fetch sales with items
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            products (name, unit)
          )
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (salesData) setSales(salesData)

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      if (paymentsData) setPayments(paymentsData)

      // Calculate product summary
      if (salesData) {
        const summary = {}
        salesData.forEach((sale) => {
          sale.sale_items.forEach((item) => {
            const productName = item.products.name
            if (!summary[productName]) {
              summary[productName] = {
                name: productName,
                unit: item.products.unit,
                total_quantity: 0,
              }
            }
            summary[productName].total_quantity += item.quantity
          })
        })
        setProductSummary(Object.values(summary).sort((a, b) => b.total_quantity - a.total_quantity))
      }
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBalance = () => {
    const openingBalance = parseFloat(customer?.opening_balance || 0)
    const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.total), 0)
    const totalPaid = sales.reduce((sum, s) => sum + parseFloat(s.paid), 0)
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    return openingBalance + totalSales - totalPaid - totalPayments
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح')
      return
    }

    const balance = calculateBalance()
    if (parseFloat(paymentAmount) > balance) {
      alert('المبلغ أكبر من رصيد العميل المستحق')
      return
    }

    setSubmittingPayment(true)
    try {
      const { error } = await supabase.from('customer_payments').insert({
        customer_id: id,
        amount: parseFloat(paymentAmount),
        notes: paymentNotes || null,
      })

      if (error) throw error

      // Create cash transaction
      await supabase.from('cash_transactions').insert({
        type: 'in',
        category: 'تحصيل عميل',
        amount: parseFloat(paymentAmount),
        description: `تحصيل من ${customer.name}`,
      })

      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      fetchCustomerData()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('حدث خطأ أثناء تسجيل الدفعة')
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">العميل غير موجود</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          العودة للعملاء
        </button>
      </div>
    )
  }

  const balance = calculateBalance()

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowRight className="ml-2 h-5 w-5" />
        العودة للعملاء
      </button>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">كشف حساب: {customer.name}</h1>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Plus className="ml-2 h-4 w-4" />
            تسجيل دفعة
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">الهاتف</p>
            <p className="font-medium">{customer.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">العنوان</p>
            <p className="font-medium">{customer.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">الرصيد الحالي</p>
            <p className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance.toFixed(2)} ج.م
            </p>
          </div>
        </div>
      </div>

      {/* Product Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Package className="ml-2 h-5 w-5" />
          إجمالي المنتجات التي أخذها العميل
        </h2>
        {productSummary.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productSummary.map((item, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">
                  {item.total_quantity} {item.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">سجل المبيعات</h2>
        {sales.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد مبيعات</p>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">فاتورة #{sale.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="ml-1 h-4 w-4" />
                      {format(new Date(sale.created_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-green-600">{parseFloat(sale.total).toFixed(2)} ج.م</p>
                    <p className="text-sm">مدفوع: {parseFloat(sale.paid).toFixed(2)} ج.م</p>
                    <p className="text-sm text-red-600">متبقي: {parseFloat(sale.due).toFixed(2)} ج.م</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium mb-2">المنتجات:</p>
                  <div className="space-y-1">
                    {sale.sale_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.products.name}</span>
                        <span>
                          {item.quantity} {item.products.unit} × {parseFloat(item.unit_price).toFixed(2)} ={' '}
                          {parseFloat(item.total).toFixed(2)} ج.م
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <DollarSign className="ml-2 h-5 w-5" />
          سجل المدفوعات
        </h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد مدفوعات</p>
        ) : (
          <div className="space-y-2">
            {payments.map((payment) => (
              <div key={payment.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <p className="font-medium">{parseFloat(payment.amount).toFixed(2)} ج.م</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(payment.created_at), 'dd/MM/yyyy')}
                  </p>
                  {payment.notes && <p className="text-sm text-gray-600">{payment.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">تسجيل دفعة من العميل</h2>
              <form onSubmit={handleRecordPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    الرصيد المستحق: {balance.toFixed(2)} ج.م
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="وصف الدفعة..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      setPaymentAmount('')
                      setPaymentNotes('')
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingPayment ? 'جاري التسجيل...' : 'تسجيل'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerStatement
