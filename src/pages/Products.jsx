import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Package, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../utils/format'

const initialFormState = {
  name: '',
  sku: '',
  unit: 'قطعة',
  buy_price: '',
  sell_price: '',
  quantity: 0,
  minimum_quantity: 0,
  supplier_id: '',
  notes: '',
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchProducts()
    fetchSuppliers()
  }, [])

  const fetchProducts = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('products')
        .select('*, suppliers(name)')
        .or('is_active.is.null,is_active.eq.true')
        .order('name')

      if (error) throw error
      setProducts((data || []).filter((p) => p.is_active !== false))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .or('is_active.is.null,is_active.eq.true')
        .order('name')

      if (error) throw error
      setSuppliers((data || []).filter((s) => s.is_active !== false))
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setErrorMessage('')
    setEditingProduct(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setErrorMessage('')
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      unit: product.unit || 'قطعة',
      buy_price: product.buy_price ?? '',
      sell_price: product.sell_price ?? '',
      quantity: product.quantity ?? 0,
      minimum_quantity: product.minimum_quantity ?? 0,
      supplier_id: product.supplier_id || '',
      notes: product.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم المنتج')
      return
    }

    const buyPrice = parseFloat(formData.buy_price)
    const sellPrice = parseFloat(formData.sell_price)
    const quantity = parseInt(formData.quantity, 10)
    const minQuantity = parseInt(formData.minimum_quantity, 10)

    if (isNaN(buyPrice) || buyPrice < 0) {
      setErrorMessage('يرجى إدخال سعر شراء صحيح (0 أو أكثر)')
      return
    }
    if (isNaN(sellPrice) || sellPrice < 0) {
      setErrorMessage('يرجى إدخال سعر بيع صحيح (0 أو أكثر)')
      return
    }

    setSubmitting(true)

    try {
      if (!supabase) {
        throw new Error('Supabase client غير مهيأ. تحقق من مفاتيح الاتصال.')
      }

      // Format payload according to schema
      const payload = {
        name: trimmedName,
        sku: formData.sku?.trim() ? formData.sku.trim() : null,
        unit: formData.unit?.trim() || 'قطعة',
        buy_price: buyPrice,
        sell_price: sellPrice,
        quantity: isNaN(quantity) ? 0 : Math.max(0, quantity),
        minimum_quantity: isNaN(minQuantity) ? 0 : Math.max(0, minQuantity),
        supplier_id: formData.supplier_id?.trim() ? formData.supplier_id.trim() : null,
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
        is_active: true,
      }

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .select('*, suppliers(name)')
          .single()

        if (error) throw error

        const updated = data || {
          ...editingProduct,
          ...payload,
          suppliers: suppliers.find((s) => s.id === payload.supplier_id)
            ? { name: suppliers.find((s) => s.id === payload.supplier_id).name }
            : null,
        }

        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)))
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('*, suppliers(name)')
          .single()

        if (error) throw error

        if (data) {
          setProducts((prev) => [data, ...prev.filter((p) => p.id !== data.id)])
        }
      }

      setShowModal(false)
      resetForm()
      // Background refetch to guarantee synchronization
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      let msg = error.message || 'حدث خطأ أثناء حفظ المنتج'
      if (
        error.code === '23505' ||
        msg.includes('products_sku_key') ||
        msg.includes('duplicate key')
      ) {
        msg = 'كود المنتج (SKU) مستخدم بالفعل، يرجى استخدام كود آخر أو تركه فارغاً.'
      }
      setErrorMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return

    try {
      if (!supabase) return

      // Try hard delete first
      const { error: deleteError } = await supabase.from('products').delete().eq('id', id)

      if (deleteError) {
        // If restricted by foreign keys (sales, purchases), perform soft-delete
        const { error: updateError } = await supabase
          .from('products')
          .update({ is_active: false })
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Immediately synchronize UI
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert(error.message || 'حدث خطأ أثناء حذف المنتج')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">المنتجات</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة منتج
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو الكود..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  سعر الشراء
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  سعر البيع
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    لا توجد منتجات مسجلة
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatCurrency(product.buy_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{formatCurrency(product.sell_price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`${
                          product.quantity <= product.minimum_quantity
                            ? 'text-red-600 font-bold'
                            : 'text-green-600'
                        }`}
                      >
                        {product.quantity} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        نشط
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
              </h2>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المنتج *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={submitting}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="اسم المنتج"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكود (SKU) <span className="text-xs text-gray-400 font-normal">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="اتركه فارغاً للتوليد التلقائي"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سعر الشراء *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={submitting}
                      value={formData.buy_price}
                      onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سعر البيع *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      disabled={submitting}
                      value={formData.sell_price}
                      onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={submitting}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحد الأدنى
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={submitting}
                      value={formData.minimum_quantity}
                      onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوحدة
                    </label>
                    <input
                      type="text"
                      disabled={submitting}
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="قطعة، كجم، إلخ"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المورد <span className="text-xs text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <select
                    disabled={submitting}
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">اختر المورد</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات
                  </label>
                  <textarea
                    disabled={submitting}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="أي ملاحظات إضافية عن المنتج..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitting ? 'جاري الحفظ...' : editingProduct ? 'تحديث' : 'إضافة'}
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

export default Products
