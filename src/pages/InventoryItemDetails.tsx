import { ChartContainer } from "@/components/dashboard/ChartContainer";
import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDateTime } from "@/lib/pos";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Loading from "@/components/ui/custom/Loading";
import { toast } from "sonner";
import { getInventoryItemById, updateInventoryItem } from "@/services/inventory";

export default function InventoryDetails() {
  const location = useLocation();
  const inventoryItemState = location.state;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["inventoryItem", inventoryItemState.id],
    queryFn: () => getInventoryItemById(inventoryItemState.id),
    enabled: !!inventoryItemState.id,
  });

  useEffect(() => {
    if (error) {
      toast.error("حدث خطأ أثناء جلب البيانات، سيتم العودة للصفحة السابقة.");
      window.history.back();
    }
  }, [error]);

  // نسخة محلية قابلة للتعديل
  const [formData, setFormData] = useState(inventoryItemState || {});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (inventoryItemState) setFormData(inventoryItemState);
  }, [inventoryItemState]);

  const mutation = useMutation({
    mutationFn: (newData: any) => updateInventoryItem(inventoryItemState.id, newData),
    onSuccess: () => {
      toast.success("✅ تم حفظ التعديلات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["inventoryItem", inventoryItemState.id] });
      setIsDirty(false);
    },
    onError: () => {
      toast.error("❌ حدث خطأ أثناء الحفظ");
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const isFormValid = Object.values(formData).every(
    (value) => String(value ?? "").trim() !== "",
  );

  const purchasesColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "totalPrice", label: "اجمالي السعر", sortable: true },
    { key: "supplierName", label: "اسم المورد", sortable: true },
    { key: "supplierId", label: "اسم المورد", sortable: true, hidden: true },
    { key: "quantity", label: "الكمية", sortable: true },
    { key: "date", label: "التاريخ", sortable: true },
  ];

  const salesColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "totalPrice", label: "اجمالي السعر", sortable: true },
    { key: "customerName", label: "اسم الزبون", sortable: true },
    { key: "customerId", label: "اسم الزبون", sortable: true, hidden: true },
    { key: "quantity", label: "الكمية", sortable: true },
    { key: "date", label: "التاريخ", sortable: true },
  ];

  type InventoryItemData = {
    inventoryItem: {
      quantity: number;
    };
    purchases: { quantity: number; totalPrice: number }[];
    sells: {
      quantity: number;
      totalPrice: number;
      date: string;
      inventoryItems: { qty: number; payPrice: number; sellPrice: number }[];
    }[];

    transfers: {
      inventoryItemId: string;
      code: string;
      name: string;
      oldWarehouse: string;
      newWarehouse: string;
      quantity: number;
      amount: number;
      currency: string;
      stockBefore: number;
      stockAfter: number;
      performedBy?: string; // userId أو name
      referenceId?: string; // رقم الفاتورة أو العملية
      note?: string;
    }[];
  };

  function transformToPieData(data: InventoryItemData) {
    const purchasedQty = data?.purchases?.reduce((sum, p) => sum + p.quantity, 0);
    const soldQty = data?.sells?.reduce((sum, s) => sum + s.quantity, 0);
    const transferQty = data?.transfers?.reduce((sum, t) => sum + t.quantity, 0);
    const remainingStock = data?.inventoryItem?.quantity;

    return [
      { name: "الكمية المشترات", value: purchasedQty },
      { name: "الكمية المباعة", value: soldQty },
      { name: "الكمية المنقولة", value: transferQty },
      { name: "الكمية المتبقية", value: remainingStock },
    ];
  }

  type InventoryItemProfitData = {
    purchases: { payPrice: number; quantity: number; date: string }[];
    sells: {
      inventoryItems: { qty: number; payPrice: number; sellPrice: number }[];
      date: string;
    }[];
  };

  function transformToProfitData(data: InventoryItemProfitData) {
    return data?.sells?.map((sell) => {
      const totalSell = sell.inventoryItems.reduce(
        (sum, p) => sum + p.qty * p.sellPrice,
        0,
      );
      const totalCost = sell.inventoryItems.reduce(
        (sum, p) => sum + p.qty * p.payPrice,
        0,
      );
      const profit = totalSell - totalCost;

      return {
        name: formatDateTime(sell.date).split("،")[0],
        profit: profit.toFixed(3),
      };
    });
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader className="flex flex-row-reverse justify-between items-center">
          <Button
            className=""
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="" />
            Go Back
          </Button>
          <CardTitle>المعلومات الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {formData &&
            Object.entries(formData).map(([key, value]) => {
              if (["id", "minQuantity"].includes(key)) return null;
              return (
                <p
                  key={key}
                  className="flex gap-2 relative group mb-4 items-end"
                >
                  <label className="block font-bold w-36">
                    {key == "costPerUnit"
                      ? "سعر شراء الواحدة"
                      : key == "unit"
                        ? "الواحدة"
                        : key == "lastUpdated"
                          ? "اخر تعديل"
                            : key == "warehouse"
                              ? "المخزن"
                              : key == "sellPerUnit"
                                ? "سعر بيع الواحدة"
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
                      value={formatDateTime(value as any)}
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
              );
            })}

          <div className="col-span-2 w-full grid grid-cols-1 gap-4">
            {isDirty && isFormValid && (
              <Button
                onClick={() => mutation.mutate(formData)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
              </Button>
            )}
              {/* <Button
                className={!isDirty ? "col-span-2" : ""}
                variant="destructive"
                onClick={() =>
                  window.confirm("هل انت متأكد من عملية الحذف")
                    ? deleteMutation.mutate(inventoryItemState.id)
                    : {}
                }
              >
                حذف المنتج
              </Button> */}
          </div>

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
        <CardContent className="grid grid-cols-2 gap-4">
          <DataTable
            className="w-full"
            title="عمليات الشراء"
            data={data ? Object.values((data?.purchases || [])) : []}
            columns={purchasesColumns}
            onRowClick={(row) => {
              navigate("/SupplierDetails", {
                state: { id: row.supplierId },
              });
            }}
          />
          <DataTable
            className="w-full"
            title="عمليات البيع"
            data={data ? Object.values((data?.sells || [])) : []}
            columns={salesColumns}
            onRowClick={(row) => {
              navigate("/customerDetails", {
                state: { id: row.customerId },
              });
            }}
          />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
