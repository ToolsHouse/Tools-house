import { useEffect, useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Save } from 'lucide-react'

const CreateSale = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [items, setItems] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paid, setPaid] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        supabase.from('products').select('*').eq('is_active', true).gt('quantity', 0).order('name'),
        supabase.from('customers').select('*').eq('is_active', true).order('name'),
      ])

      if (productsRes.error) throw productsRes.error
      if (customersRes.error) throw customersRes.error

      setProducts(productsRes.data || [])
      setCustomers(customersRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value

    if (field === 'product_id') {
      const product = products.find((p) => p.id === value)
      if (product) {
        newItems[index].unit_price = product.sell_price
        newItems[index].total = product.sell_price * newItems[index].quantity
      }
    } else if (field === 'quantity') {
      newItems[index].total = newItems[index].unit_price * value
    } else if (field === 'unit_price') {
      newItems[index].total = value * newItems[index].quantity
    }

    setItems(newItems)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const total = Math.max(0, subtotal - discount)
    const finalPaid = Math.min(paid, total)
    const due = total - finalPaid
    return { subtotal, total, paid: finalPaid, due }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      alert('يرجى إضافة منتج واحد على الأقل')
      return
    }

    setSubmitting(true)
    try {
      const { subtotal, total, paid: finalPaid, due } = calculateTotals()

      // Create sale with items in a transaction-like operation
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          customer_id: selectedCustomer || null,
          subtotal,
          discount,
          total,
          paid: finalPaid,
          due,
          notes,
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Create sale items
      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      // Update product quantities
      for (const item of items) {
        const product = products.find((p) => p.id === item.product_id)
        if (product) {
          const newQuantity = product.quantity - item.quantity
          if (newQuantity < 0) {
            throw new Error(`الكمية غير كافية للمنتج: ${product.name}`)
          }
          const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQuantity })
            .eq('id', item.product_id)
          if (updateError) throw updateError
        }
      }

      // Create cash transaction if paid > 0
      if (finalPaid > 0) {
        await supabase.from('cash_transactions').insert({
          type: 'in',
          category: 'بيع',
          amount: finalPaid,
          description: `تحصيل فاتورة بيع #${sale.id.slice(0, 8)}`,
        })
      }

      navigate(`/sales/${sale.id}`)
    } catch (error) {
      console.error('Error creating sale:', error)
      alert(error.message || 'حدث خطأ أثناء حفظ الفاتورة')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    )
  }

  const { subtotal, total, paid: finalPaid, due } = calculateTotals()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">فاتورة بيع جديدة</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">بيانات الفاتورة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العميل
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">عميل نقدي</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الخصم
              </label>
              <input
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">المنتجات</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <Plus className="ml-1 h-4 w-4" />
              إضافة منتج
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المنتج
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">اختر المنتج</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} (متوفر: {product.quantity} {product.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السعر
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الإجمالي
                    </label>
                    <input
                      type="text"
                      value={item.total.toFixed(2)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">الملخص</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>المجموع:</span>
              <span>{subtotal.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span>الخصم:</span>
              <span>-{discount.toFixed(2)} ج.م</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>الإجمالي:</span>
              <span>{total.toFixed(2)} ج.م</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المدفوع
              </label>
              <input
                type="number"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>المتبقي:</span>
              <span className={due > 0 ? 'text-red-600' : 'text-green-600'}>
                {due.toFixed(2)} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales')}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="ml-2 h-5 w-5" />
            {submitting ? 'جاري الحفظ...' : 'حفظ الفاتورة'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateSale
