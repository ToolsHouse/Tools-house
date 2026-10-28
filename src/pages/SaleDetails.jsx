import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../contexts/AuthContext'
import { ArrowRight, MessageCircle, Printer } from 'lucide-react'
import { format } from 'date-fns'

const SaleDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sale, setSale] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSaleDetails()
  }, [id])

  const fetchSaleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (name, phone, address),
          sale_items (
            *,
            products (name, unit)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setSale(data)
    } catch (error) {
      console.error('Error fetching sale details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    if (!sale.customers?.phone) {
      alert('العميل ليس لديه رقم هاتف')
      return
    }

    const phone = formatPhoneForWhatsApp(sale.customers.phone)
    const message = generateWhatsAppMessage(sale)
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const formatPhoneForWhatsApp = (phone) => {
    phone = phone.replace(/[^0-9]/g, '')
    if (phone.startsWith('20') && phone.length === 12) {
      return phone
    }
    if (phone.startsWith('0') && phone.length === 11) {
      return '20' + phone.slice(1)
    }
    if (phone.startsWith('2') && phone.length === 12) {
      return phone
    }
    if (phone.length === 10) {
      return '20' + phone
    }
    return phone
  }

  const generateWhatsAppMessage = (sale) => {
    let message = '🧾 TOOLS HOUSE\n'
    message += '━━━━━━━━━━━━━━━━━━\n'
    message += `فاتورة بيع رقم: #${sale.id.slice(0, 8)}\n`
    message += `📅 التاريخ: ${format(new Date(sale.created_at), 'dd/MM/yyyy')}\n`
    if (sale.customers) {
      message += `👤 العميل: ${sale.customers.name}\n`
    }
    message += '🛒 المنتجات:\n'
    message += '━━━━━━━━━━━━━━━━━━\n'

    let index = 1
    sale.sale_items.forEach((item) => {
      message += `${index}️⃣ ${item.products.name}\n`
      message += `الكمية: ${item.quantity} ${item.products.unit}\n`
      message += `السعر: ${parseFloat(item.unit_price).toFixed(2)} ج.م\n`
      message += `الإجمالي: ${parseFloat(item.total).toFixed(2)} ج.م\n`
      index++
    })

    message += '━━━━━━━━━━━━━━━━━━\n'
    message += `💰 إجمالي الفاتورة: ${parseFloat(sale.total).toFixed(2)} ج.م\n`
    message += `💵 المدفوع: ${parseFloat(sale.paid).toFixed(2)} ج.م\n`
    message += `📌 المتبقي: ${parseFloat(sale.due).toFixed(2)} ج.م\n`

    if (sale.due == 0) {
      message += '✅ حالة الحساب: مدفوع بالكامل\n'
      message += 'شكراً لتعاملكم مع TOOLS HOUSE 🤍'
    } else {
      message += '⚠️ حالة الحساب: آجل\n'
      message += 'برجاء السداد في أقرب وقت.\n'
      message += 'شكراً لتعاملكم مع TOOLS HOUSE 🤍'
    }

    return message
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">الفاتورة غير موجودة</p>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          العودة للمبيعات
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/sales')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className="ml-2 h-5 w-5" />
          العودة للمبيعات
        </button>
        <div className="flex gap-2">
          {sale.customers?.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <MessageCircle className="ml-2 h-5 w-5" />
              واتساب
            </button>
          )}
        </div>
      </div>

      {/* Invoice Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">TOOLS HOUSE</h1>
          <p className="text-gray-600">فاتورة بيع</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">رقم الفاتورة</p>
            <p className="font-bold">#{sale.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التاريخ</p>
            <p className="font-medium">{format(new Date(sale.created_at), 'dd/MM/yyyy')}</p>
          </div>
          {sale.customers && (
            <>
              <div>
                <p className="text-sm text-gray-500">العميل</p>
                <p className="font-medium">{sale.customers.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">الهاتف</p>
                <p className="font-medium">{sale.customers.phone || '-'}</p>
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
              {sale.sale_items.map((item) => (
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
            <span>{parseFloat(sale.subtotal).toFixed(2)} ج.م</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم:</span>
              <span>-{parseFloat(sale.discount).toFixed(2)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>الإجمالي:</span>
            <span>{parseFloat(sale.total).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>المدفوع:</span>
            <span>{parseFloat(sale.paid).toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t pt-2">
            <span>المتبقي:</span>
            <span className={sale.due > 0 ? 'text-red-600' : 'text-green-600'}>
              {parseFloat(sale.due).toFixed(2)} ج.م
            </span>
          </div>
        </div>

        {sale.notes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">ملاحظات:</p>
            <p>{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SaleDetails
