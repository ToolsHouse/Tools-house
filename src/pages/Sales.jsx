import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Search, Eye, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const Sales = () => {
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers (name, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (s) =>
      s.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.includes(searchTerm)
  )

  const handleWhatsApp = async (sale) => {
    const phone = formatPhoneForWhatsApp(sale.customers.phone)

    // Fetch sale items with products
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('*, products (name, unit)')
      .eq('sale_id', sale.id)

    const message = generateWhatsAppMessage(sale, saleItems || [])
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

  const generateWhatsAppMessage = (sale, saleItems) => {
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
    saleItems.forEach((item) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">المبيعات</h1>
        <button
          onClick={() => navigate('/sales/create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="ml-2 h-5 w-5" />
          فاتورة جديدة
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالعميل أو رقم الفاتورة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجمالي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدفوع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المتبقي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    #{sale.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {format(new Date(sale.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sale.customers?.name || 'عميل نقدي'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    {parseFloat(sale.total).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {parseFloat(sale.paid).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">
                    {parseFloat(sale.due).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/sales/${sale.id}`)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {sale.customers?.phone && (
                      <button
                        onClick={() => handleWhatsApp(sale)}
                        className="text-green-600 hover:text-green-900"
                        title="إرسال واتساب"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Sales
