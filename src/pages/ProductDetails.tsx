import { ChartContainer } from "@/components/dashboard/ChartContainer"
import { DataTable } from "@/components/dashboard/DataTable"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { getProductById, updateProduct, deleteProduct } from "@/services/inventory"
import CardContent from "@mui/material/CardContent"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function ProductDetails() {
  const location = useLocation()
  const productState = location.state
  const navigate = useNavigate()
  const queryClient = useQueryClient();


  const { data, isLoading, error } = useQuery({
    queryKey: ["product", productState.id],
    queryFn: () => getProductById(productState.id),
    enabled: !!productState.id,
  })

  // نسخة محلية قابلة للتعديل
  const [formData, setFormData] = useState(productState || {})
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (productState) setFormData(productState)
  }, [productState])

  const mutation = useMutation({
    mutationFn: (newData: any) => updateProduct(productState.id, newData),
    onSuccess: () => {
      alert("✅ تم حفظ التعديلات بنجاح")
      setIsDirty(false)
    },
    onError: () => {
      alert("❌ حدث خطأ أثناء الحفظ")
    },
  })

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      
      queryClient.invalidateQueries({
        queryKey: ['products-table'],
      });
      alert("تم حذف المنتج");
      navigate('/products')
    },
    onError: () => {
      alert("فشل الحذف");
    },
  });

  const purchasesColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "totalPrice", label: "اجمالي السعر", sortable: true },
    { key: "supplierName", label: "اسم المورد", sortable: true },
    { key: "quantity", label: "الكمية", sortable: true },
    { key: "date", label: "التاريخ", sortable: true },
  ]

  const salesColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "totalPrice", label: "اجمالي السعر", sortable: true },
    { key: "customerName", label: "اسم المورد", sortable: true },
    { key: "quantity", label: "الكمية", sortable: true },
    { key: "date", label: "التاريخ", sortable: true },
  ]

  type ProductData = {
    product: {
      quantity: number
    }
    purchases: { quantity: number; totalPrice: number }[]
    sells: {
      quantity: number
      totalPrice: number
      date: string
      products: { qty: number; payPrice: number; sellPrice: number }[]
    }[]
  }

  function transformToPieData(data: ProductData) {
    const purchasedQty = data.purchases.reduce((sum, p) => sum + p.quantity, 0)
    const soldQty = data.sells.reduce((sum, s) => sum + s.quantity, 0)
    const remainingStock = data.product.quantity

    return [
      { name: "الكمية المشترات", value: purchasedQty },
      { name: "الكمية المباعة", value: soldQty },
      { name: "الكمية المتبقية", value: remainingStock },
    ]
  }

  type ProductProfitData = {
    purchases: { payPrice: number; quantity: number; date: string }[]
    sells: {
      products: { qty: number; payPrice: number; sellPrice: number }[]
      date: string
    }[]
  }

  function transformToProfitData(data: ProductProfitData) {
    return data.sells.map((sell) => {
      const totalSell = sell.products.reduce(
        (sum, p) => sum + p.qty * p.sellPrice,
        0
      )
      const totalCost = sell.products.reduce(
        (sum, p) => sum + p.qty * p.payPrice,
        0
      )
      const profit = totalSell - totalCost

      return {
        name: new Date(sell.date).toLocaleDateString(),
        profit,
      }
    })
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>المعلومات الأساسية</CardTitle>
          {isDirty && (
            <Button
              onClick={() => mutation.mutate(formData)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {formData &&
            Object.entries(formData).map(([key, value]) => {
              if (key === "id") return null
              return (
                <p
                  key={key}
                  className="flex gap-2 relative group mb-4 items-end"
                >
                  <label className="block font-bold w-36">
                    {key == "payPrice"
                      ? "سعر الشراء"
                      : key == "unit"
                      ? "الواحدة"
                      : key == "updatedDate"
                      ? "اخر تعديل"
                      : key == "code"
                      ? "الرمز"
                      : key == "warehouse"
                      ? "المخزن"
                      : key == "sellPrice"
                      ? "سعر المبيع"
                      : key == "quantity"
                      ? "الكمية"
                      : key == "category"
                      ? "الفئة"
                      : key == "name"
                      ? "الاسم"
                      : key}
                    :
                  </label>
                  {key.includes("date") &&
                  new Date(value as any).toString() !== "Invalid Date" ? (
                    <input
                      type="text"
                      value={new Date(value as any).toLocaleString("en-GB")}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="bg-transparent border-b-2 border-transparent focus:border-primary-500 outline-none transition-all w-full"
                    />
                  ) : (
                    <input
                      type="text"
                      value={value as any}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="bg-transparent border-b-2 border-transparent focus:border-primary-500 outline-none transition-all w-full"
                    />
                  )}
                  <span className="absolute bottom-0 right-0 w-full h-[2px] bg-primary-500 scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300"></span>
                </p>
              )
            })}
            <Button
              className="col-span-2"
              variant="destructive"
              onClick={() => 
                (window.confirm("هل انت متأكد من عملية الحذف")) ?
                  deleteMutation.mutate(productState.id)
                :
                  {}
              }
            >
              حذف المنتج
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>نظرة عامة</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <ChartContainer
            title="المشتريات vs المبيعات vs المخزون"
            data={data ? transformToPieData(data) : []}
            dataKey="value"
            type="pie"
          />
          <ChartContainer
            title="المرابح"
            type="bar"
            data={data ? transformToProfitData(data) : []}
            dataKey="profit"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>جداول البيانات</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <DataTable
            className="w-full"
            title="عمليات الشراء"
            data={data ? Object.values(data.purchases) : []}
            columns={purchasesColumns}
          />
          <DataTable
            className="w-full"
            title="عمليات البيع"
            data={data ? Object.values(data.sells) : []}
            columns={salesColumns}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
