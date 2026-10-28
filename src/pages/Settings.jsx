import { useState } from 'react'
import { supabase } from '../contexts/AuthContext'
import { Download, Upload, Shield, Database } from 'lucide-react'

const Settings = () => {
  const [loading, setLoading] = useState(false)
  const [restoreFile, setRestoreFile] = useState(null)
  const [restorePreview, setRestorePreview] = useState(null)

  const handleBackup = async () => {
    setLoading(true)
    try {
      // Fetch all data
      const [
        customers,
        suppliers,
        products,
        sales,
        saleItems,
        customerPayments,
        purchases,
        purchaseItems,
        supplierPayments,
        expenses,
        cashTransactions,
      ] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('products').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('sale_items').select('*'),
        supabase.from('customer_payments').select('*'),
        supabase.from('purchases').select('*'),
        supabase.from('purchase_items').select('*'),
        supabase.from('supplier_payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('cash_transactions').select('*'),
      ])

      const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        data: {
          customers: customers.data || [],
          suppliers: suppliers.data || [],
          products: products.data || [],
          sales: sales.data || [],
          sale_items: saleItems.data || [],
          customer_payments: customerPayments.data || [],
          purchases: purchases.data || [],
          purchase_items: purchaseItems.data || [],
          supplier_payments: supplierPayments.data || [],
          expenses: expenses.data || [],
          cash_transactions: cashTransactions.data || [],
        },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ToolsHouse_Backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setRestoreFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target.result)
          setRestorePreview(backup)
        } catch (error) {
          alert('ملف غير صالح')
          setRestoreFile(null)
          setRestorePreview(null)
        }
      }
      reader.readAsText(file)
    }
  }

  const validateBackup = (backup) => {
    if (!backup.version || !backup.data) {
      return false
    }
    const requiredTables = [
      'customers',
      'suppliers',
      'products',
      'sales',
      'sale_items',
      'customer_payments',
      'purchases',
      'purchase_items',
      'supplier_payments',
      'expenses',
      'cash_transactions',
    ]
    return requiredTables.every((table) => Array.isArray(backup.data[table]))
  }

  const handleRestore = async () => {
    if (!restorePreview || !validateBackup(restorePreview)) {
      alert('النسخة الاحتياطية غير صالحة')
      return
    }

    if (
      !confirm(
        'هل أنت متأكد من استعادة النسخة الاحتياطية؟\n\nسيتم دمج البيانات مع البيانات الحالية.\nهذه العملية لا يمكن التراجع عنها.'
      )
    ) {
      return
    }

    setLoading(true)
    try {
      const { data } = restorePreview

      // Restore data (using upsert to avoid duplicates)
      const tables = [
        { name: 'customers', data: data.customers },
        { name: 'suppliers', data: data.suppliers },
        { name: 'products', data: data.products },
        { name: 'sales', data: data.sales },
        { name: 'sale_items', data: data.sale_items },
        { name: 'customer_payments', data: data.customer_payments },
        { name: 'purchases', data: data.purchases },
        { name: 'purchase_items', data: data.purchase_items },
        { name: 'supplier_payments', data: data.supplier_payments },
        { name: 'expenses', data: data.expenses },
        { name: 'cash_transactions', data: data.cash_transactions },
      ]

      for (const table of tables) {
        if (table.data && table.data.length > 0) {
          // Remove id and timestamps for upsert
          const cleanData = table.data.map((item) => {
            const { id, created_at, updated_at, ...rest } = item
            return rest
          })

          const { error } = await supabase.from(table.name).upsert(cleanData, {
            onConflict: 'id',
            ignoreDuplicates: false,
          })

          if (error) {
            console.error(`Error restoring ${table.name}:`, error)
          }
        }
      }

      alert('تم استعادة النسخة الاحتياطية بنجاح')
      setRestoreFile(null)
      setRestorePreview(null)
    } catch (error) {
      console.error('Error restoring backup:', error)
      alert('حدث خطأ أثناء استعادة النسخة الاحتياطية')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>

      {/* Backup Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="ml-2 h-5 w-5 text-blue-600" />
          النسخ الاحتياطي والاستعادة
        </h2>

        <div className="space-y-6">
          {/* Backup */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Download className="ml-2 h-4 w-4" />
              تصدير نسخة احتياطية
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              قم بتنزيل نسخة احتياطية من جميع بيانات النظام (العملاء، المنتجات، المبيعات، المشتريات، المصروفات، إلخ).
            </p>
            <button
              onClick={handleBackup}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="ml-2 h-4 w-4" />
              {loading ? 'جاري التصدير...' : 'تصدير نسخة احتياطية'}
            </button>
          </div>

          {/* Restore */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Upload className="ml-2 h-4 w-4" />
              استيراد نسخة احتياطية
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              قم باستيراد نسخة احتياطية لاستعادة البيانات. سيتم دمج البيانات مع البيانات الحالية.
            </p>
            <div className="space-y-4">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {restorePreview && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">معاينة النسخة الاحتياطية:</h4>
                  <div className="text-sm space-y-1">
                    <p>الإصدار: {restorePreview.version}</p>
                    <p>التاريخ: {new Date(restorePreview.date).toLocaleString('ar-EG')}</p>
                    <div className="mt-2">
                      <p className="font-medium">البيانات:</p>
                      <ul className="list-disc list-inside mr-4">
                        {Object.entries(restorePreview.data).map(([key, value]) => (
                          <li key={key}>
                            {key}: {Array.isArray(value) ? value.length : 0} سجلات
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={handleRestore}
                    disabled={loading}
                    className="mt-4 flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="ml-2 h-4 w-4" />
                    {loading ? 'جاري الاستعادة...' : 'استعادة النسخة الاحتياطية'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Shield className="ml-2 h-5 w-5 text-green-600" />
          معلومات الأمان
        </h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• يتم تشفير جميع البيانات باستخدام Supabase PostgreSQL</p>
          <p>• يتم تطبيق سياسات أمان على مستوى الصف (Row Level Security)</p>
          <p>• لا يتم تخزين أي مفاتيح سرية في الواجهة الأمامية</p>
          <p>• يتم استخدام مفتاح النشر (publishable key) فقط للاتصال بقاعدة البيانات</p>
          <p>• يلزم تسجيل الدخول للوصول إلى أي بيانات</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
