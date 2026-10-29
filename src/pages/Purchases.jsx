import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Search, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const Purchases = () => {
  const [purchases, setPurchases] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = purchases.filter(
    (p) =>
      p.suppliers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.includes(searchTerm)
  )

  const handleDeletePurchase = async (purchase) => {
    const confirmed = window.confirm(
      `هل أنت متأكد أنك تريد حذف الفاتورة #${purchase.id.slice(0, 8)}؟\nسيتم عكس الكميات في المخزون.\nلا يمكن التراجع عن هذا الإجراء.`
    )
    if (!confirmed) return

    setDeletingId(purchase.id)
    setDeleteError('')

    try {
      // 1. Fetch purchase items to reverse stock
      const { data: purchaseItems, error: itemsError } = await supabase
        .from('purchase_items')
        .select('product_id, quantity')
        .eq('purchase_id', purchase.id)

      if (itemsError) throw itemsError

      // 2. Reverse stock for each item (subtract quantities that were added by this purchase)
      for (const item of purchaseItems || []) {
        const { data: product, error: fetchErr } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single()

        if (fetchErr) throw fetchErr

        const newQty = Math.max(0, (parseFloat(product.quantity) || 0) - parseFloat(item.quantity))
        const { error: updateErr } = await supabase
          .from('products')
          .update({ quantity: newQty })
          .eq('id', item.product_id)

        if (updateErr) throw updateErr
      }

      // 3. Delete the purchase (purchase_items cascade automatically)
      const { error: deleteErr } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchase.id)

      if (deleteErr) throw deleteErr

      // 4. Remove from UI immediately
      setPurchases((prev) => prev.filter((p) => p.id !== purchase.id))
    } catch (err) {
      console.error('Error deleting purchase:', err)
      setDeleteError('حدث خطأ أثناء حذف الفاتورة: ' + (err.message || 'خطأ غير معروف'))
    } finally {
      setDeletingId(null)
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">المشتريات</h1>
        <button
          onClick={() => navigate('/purchases/create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="ml-2 h-5 w-5" />
          فاتورة شراء جديدة
        </button>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError('')}
            className="mr-auto text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالمورد أو رقم الفاتورة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Purchases Table */}
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
                  المورد
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
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    #{purchase.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {format(new Date(purchase.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {purchase.suppliers?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">
                    {parseFloat(purchase.total).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600">
                    {parseFloat(purchase.paid).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-600">
                    {parseFloat(purchase.due).toFixed(2)} ج.م
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/purchases/${purchase.id}`)}
                      className="text-blue-600 hover:text-blue-900 ml-3"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(purchase)}
                      disabled={deletingId === purchase.id}
                      className="p-1 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="حذف الفاتورة"
                    >
                      {deletingId === purchase.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
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

export default Purchases
