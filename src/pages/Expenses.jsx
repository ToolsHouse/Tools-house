import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Plus, Pencil, Trash2, Search, Wallet, AlertCircle } from 'lucide-react'
import { formatCurrency } from '../utils/format'

const initialFormState = {
  description: '',
  amount: '',
  category: '',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '',
}

const Expenses = () => {
  const [expenses, setExpenses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      if (!supabase) return
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setErrorMessage('')
    setEditingExpense(null)
  }

  const openCreateModal = () => {
    resetForm()
    setShowModal(true)
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    setErrorMessage('')
    setFormData({
      description: expense.description || '',
      amount: expense.amount ?? '',
      category: expense.category || '',
      expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      notes: expense.notes || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedDesc = formData.description.trim()
    if (!trimmedDesc) {
      setErrorMessage('يرجى إدخال وصف المصروف')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('يرجى إدخال مبلغ صحيح أكبر من صفر')
      return
    }

    if (!formData.expense_date) {
      setErrorMessage('يرجى تحديد تاريخ المصروف')
      return
    }

    setSubmitting(true)
    try {
      if (!supabase) {
        throw new Error('Supabase client غير مهيأ.')
      }

      const payload = {
        description: trimmedDesc,
        amount,
        category: formData.category?.trim() ? formData.category.trim() : null,
        expense_date: formData.expense_date,
        notes: formData.notes?.trim() ? formData.notes.trim() : null,
      }

      if (editingExpense) {
        const { data, error } = await supabase
          .from('expenses')
          .update(payload)
          .eq('id', editingExpense.id)
          .select()
          .single()

        if (error) throw error

        const updated = data || { ...editingExpense, ...payload }
        setExpenses((prev) => prev.map((item) => (item.id === editingExpense.id ? updated : item)))
      } else {
        const { data, error } = await supabase
          .from('expenses')
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setExpenses((prev) => [data, ...prev.filter((item) => item.id !== data.id)])
        }
      }

      setShowModal(false)
      resetForm()
      fetchExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      setErrorMessage(error.message || 'حدث خطأ أثناء حفظ المصروف')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return

    try {
      if (!supabase) return
      const { error } = await supabase.from('expenses').delete().eq('id', id)

      if (error) throw error

      // Immediately synchronize UI
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert(error.message || 'حدث خطأ أثناء حذف المصروف')
    }
  }

  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <h1 className="text-2xl font-bold text-gray-900">المصروفات</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="ml-2 h-5 w-5" />
          إضافة مصروف
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="بحث بالوصف أو الفئة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <Wallet className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    لا توجد مصروفات مسجلة
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {expense.expense_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">
                        {expense.category || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
                {editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
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
                    الوصف *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="وصف المصروف"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المبلغ *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      disabled={submitting}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      التاريخ *
                    </label>
                    <input
                      type="date"
                      required
                      disabled={submitting}
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الفئة
                  </label>
                  <input
                    type="text"
                    disabled={submitting}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="مثال: إيجار، كهرباء، صيانة..."
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
                    {submitting ? 'جاري الحفظ...' : editingExpense ? 'تحديث' : 'إضافة'}
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

export default Expenses
