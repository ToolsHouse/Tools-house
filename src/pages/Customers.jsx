import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Users, DollarSign, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../utils/format'

const initialFormState = {
  name: '',
  phone: '',
  address: '',
  opening_balance: 0,
  notes: '',
}

const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormState)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .order('name')

      if (error) throw error
      setCustomers((data || []).filter((c) => c.is_active !== false))
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setErrorMessage('')
    setEditingCustomer(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setErrorMessage('')
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      opening_balance: customer.opening_balance ?? 0,
      notes: customer.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedName = formData.name.trim()
    if (!trimmedName) {
      setErrorMessage('يرجى إدخال اسم العميل')
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

      if (editingCustomer) {
        const { data, error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id)
          .select()
          .single()

        if (error) throw error

        const updated = data || { ...editingCustomer, ...payload }
        setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? updated : c)))
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setCustomers((prev) => [data, ...prev.filter((c) => c.id !== data.id)])
        }
      }

      setShowModal(false)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error('Error saving customer:', error)
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ العميل')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

    try {
      if (!supabase) return

      // Try hard delete first
      const { error: deleteError } = await supabase.from('customers').delete().eq('id', id)

      if (deleteError) {
        // Fall back to soft-delete if foreign key constraints restrict hard deletion
        const { error: updateError } = await supabase
          .from('customers')
          .update({ is_active: false })
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Immediately synchronize UI
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert(error.message || 'حدث خطأ أثناء حذف العميل')
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">العملاء</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة عميل
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالاسم أو الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow bg-white"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    لا يوجد عملاء مسجلين
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.address || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {formatCurrency(customer.opening_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}/statement`)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="كشف الحساب"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900">
                {editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
              </h2>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-100"
                    placeholder="اسم العميل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    الهاتف
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-100"
                    placeholder="رقم الهاتف"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    العنوان
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-100"
                    placeholder="العنوان"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    الرصيد الافتتاحي
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={submitting}
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ملاحظات
                  </label>
                  <textarea
                    disabled={submitting}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none disabled:bg-gray-100"
                    placeholder="ملاحظات اختيارية..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitting ? 'جاري الحفظ...' : editingCustomer ? 'تحديث' : 'إضافة'}
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

export default Customers
