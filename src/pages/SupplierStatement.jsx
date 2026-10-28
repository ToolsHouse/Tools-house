import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import { ArrowRight, Package, DollarSign, Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'

const SupplierStatement = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [submittingPayment, setSubmittingPayment] = useState(false)

  useEffect(() => {
    fetchSupplierData()
  }, [id])

  const fetchSupplierData = async () => {
    try {
      // Fetch supplier
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single()

      if (supplierData) setSupplier(supplierData)

      // Fetch purchases with items
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items (
            *,
            products (name, unit)
          )
        `)
        .eq('supplier_id', id)
        .order('created_at', { ascending: false })

      if (purchasesData) setPurchases(purchasesData)

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', id)
        .order('created_at', { ascending: false })

      if (paymentsData) setPayments(paymentsData)
    } catch (error) {
      console.error('Error fetching supplier data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBalance = () => {
    const openingBalance = parseFloat(supplier?.opening_balance || 0)
    const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total), 0)
    const totalPaid = purchases.reduce((sum, p) => sum + parseFloat(p.paid), 0)
    const totalPayments = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    return openingBalance + totalPurchases - totalPaid - totalPayments
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح')
      return
    }

    const balance = calculateBalance()
    if (parseFloat(paymentAmount) > balance) {
      alert('المبلغ أكبر من رصيد المورد المستحق')
      return
    }

    setSubmittingPayment(true)
    try {
      const { error } = await supabase.from('supplier_payments').insert({
        supplier_id: id,
        amount: parseFloat(paymentAmount),
        notes: paymentNotes || null,
      })

      if (error) throw error

      // Create cash transaction
      await supabase.from('cash_transactions').insert({
        type: 'out',
        category: 'دفع مورد',
        amount: parseFloat(paymentAmount),
        description: `دفع للمورد ${supplier.name}`,
      })

      setShowPaymentModal(false)
      setPaymentAmount('')
      setPaymentNotes('')
      fetchSupplierData()
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

  if (!supplier) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">المورد غير موجود</p>
        <button
          onClick={() => navigate('/suppliers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          العودة للموردين
        </button>
      </div>
    )
  }

  const balance = calculateBalance()

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/suppliers')}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowRight className="ml-2 h-5 w-5" />
        العودة للموردين
      </button>

      {/* Supplier Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">كشف حساب: {supplier.name}</h1>
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
            <p className="font-medium">{supplier.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">العنوان</p>
            <p className="font-medium">{supplier.address || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">الرصيد الحالي</p>
            <p className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {balance.toFixed(2)} ج.م
            </p>
          </div>
        </div>
      </div>

      {/* Purchases */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">سجل المشتريات</h2>
        {purchases.length === 0 ? (
          <p className="text-gray-500 text-center py-4">لا توجد مشتريات</p>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">فاتورة #{purchase.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="ml-1 h-4 w-4" />
                      {format(new Date(purchase.created_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-blue-600">{parseFloat(purchase.total).toFixed(2)} ج.م</p>
                    <p className="text-sm">مدفوع: {parseFloat(purchase.paid).toFixed(2)} ج.م</p>
                    <p className="text-sm text-red-600">متبقي: {parseFloat(purchase.due).toFixed(2)} ج.م</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3">
                  <p className="text-sm font-medium mb-2">المنتجات:</p>
                  <div className="space-y-1">
                    {purchase.purchase_items.map((item) => (
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
              <h2 className="text-xl font-bold mb-4">تسجيل دفعة للمورد</h2>
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

export default SupplierStatement
