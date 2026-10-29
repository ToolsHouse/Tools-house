import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Truck, FileText, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/format'

const initialFormState = {
  name: '',
  phone: '',
  address: '',
  opening_balance: 0,
  notes: '',
}

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormState)
  const navigate = useNavigate()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('name')

      if (error) throw error
      setSuppliers((data || []).filter((s) => s.is_active !== false))
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setErrorMessage('')
    setEditingSupplier(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setErrorMessage('')
    setFormData({
      name: supplier.name || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      opening_balance: supplier.opening_balance ?? 0,
      notes: supplier.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم المورد')
      return
    }

    const openingBalance = parseFloat(formData.opening_balance) || 0

    setSubmitting(true)
    try {
      if (!supabase) {
        throw new Error('Supabase client غير مهيأ.')
      }

      const payload = {
        name: trimmedName,
        phone: formData.phone?.trim() ? formData.phone.trim() : null,
        address: formData.address?.trim() ? formData.address.trim() : null,
        opening_balance: openingBalance,
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
        is_active: true,
      }

      if (editingSupplier) {
        const { data, error } = await supabase
          .from('suppliers')
          .update(payload)
          .eq('id', editingSupplier.id)
          .select()
          .single()

        if (error) throw error

        const updated = data || { ...editingSupplier, ...payload }
        setSuppliers((prev) => prev.map((s) => (s.id === editingSupplier.id ? updated : s)))
      } else {
        const { data, error } = await supabase
          .from('suppliers')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setSuppliers((prev) => [data, ...prev.filter((s) => s.id !== data.id)])
        }
      }

      setShowModal(false)
      resetForm()
      fetchSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ المورد')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المورد؟')) return

    try {
      if (!supabase) return

      // Try hard delete first
      const { error: deleteError } = await supabase.from('suppliers').delete().eq('id', id)

      if (deleteError) {
        // Fall back to soft-delete if foreign key constraints restrict hard deletion
        const { error: updateError } = await supabase
          .from('suppliers')
          .update({ is_active: false })
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Immediately synchronize UI
      setSuppliers((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert(error.message || 'حدث خطأ أثناء حذف المورد')
    }
  }

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm))
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
        <h1 className="text-2xl font-bold text-gray-900">الموردين</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة مورد
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الرصيد الافتتاحي
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <Truck className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    لا يوجد موردين مسجلين
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{supplier.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {formatCurrency(supplier.opening_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => navigate(`/suppliers/${supplier.id}/statement`)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="كشف الحساب"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id)}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {editingSupplier ? 'تعديل مورد' : 'إضافة مورد جديد'}
              </h2>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المورد *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="اسم المورد"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الهاتف
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="رقم الهاتف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="العنوان"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الرصيد الافتتاحي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={submitting}
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 resize-none"
                    placeholder="ملاحظات اختيارية..."
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
                    {submitting ? 'جاري الحفظ...' : editingSupplier ? 'تحديث' : 'إضافة'}
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

export default Suppliers
