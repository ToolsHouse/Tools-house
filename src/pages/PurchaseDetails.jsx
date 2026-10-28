import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import { ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

const PurchaseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPurchaseDetails()
  }, [id])

  const fetchPurchaseDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (name, phone, address),
          purchase_items (
            *,
            products (name, unit)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setPurchase(data)
    } catch (error) {
      console.error('Error fetching purchase details:', error)
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

  if (!purchase) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">الفاتورة غير موجودة</p>
        <button
          onClick={() => navigate('/purchases')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          العودة للمشتريات
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/purchases')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          العودة للمشتريات
        </button>
      </div>

      {/* Invoice Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">TOOLS HOUSE</h1>
          <p className="text-gray-600">فاتورة شراء</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">رقم الفاتورة</p>
            <p className="font-bold">#{purchase.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التاريخ</p>
            <p className="font-medium">{format(new Date(purchase.created_at), 'dd/MM/yyyy')}</p>
          </div>
          {purchase.suppliers && (
            <>
              <div>
                <p className="text-sm text-gray-500">المورد</p>
                <p className="font-medium">{purchase.suppliers.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الهاتف</p>
                <p className="font-medium">{purchase.suppliers.phone || '-'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">المنتجات</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المنتج
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الكمية
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  السعر
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchase.purchase_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.products.name}</td>
                  <td className="px-4 py-3">
                    {item.quantity} {item.products.unit}
                  </td>
                  <td className="px-4 py-3">{parseFloat(item.unit_price).toFixed(2)} ج.م</td>
                  <td className="px-4 py-3 font-bold">
                    {parseFloat(item.total).toFixed(2)} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>المجموع:</span>
            <span>{parseFloat(purchase.subtotal).toFixed(2)} ج.م</span>
          </div>
          {purchase.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم:</span>
              <span>-{parseFloat(purchase.discount).toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>الإجمالي:</span>
            <span>{parseFloat(purchase.total).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>المدفوع:</span>
            <span>{parseFloat(purchase.paid).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>المتبقي:</span>
            <span className={purchase.due > 0 ? 'text-red-600' : 'text-green-600'}>
              {parseFloat(purchase.due).toFixed(2)} ج.م
            </span>
          </div>
        </div>

        {purchase.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">ملاحظات:</p>
            <p>{purchase.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PurchaseDetails
