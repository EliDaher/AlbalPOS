import { DataTable } from "@/components/dashboard/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import SupplierSelect from "@/components/Products/SupplierSelect";
import { Button } from "@/components/ui/button";
import PopupForm from "@/components/ui/custom/PopupForm";
import getAllSupplier from "@/services/supplier";
import { useQuery } from "@tanstack/react-query";
import { HandCoins, Users2, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Suppliers() {
  const navigate = useNavigate();
  const [openSupplier, setOpenSupplier] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  // جلب الموردين
  const {
    data: suppliers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["suppliers-table"],
    queryFn: getAllSupplier,
  });

  // حساب الإحصائيات
  const suppliersDebt = useMemo(
    () =>
      suppliers
        ?.filter((s) => s.balance > 0)
        .reduce((sum, s) => sum + Number(s.balance), 0) || 0,
    [suppliers],
  );

  const totalSuppliers = suppliers ? Object.keys(suppliers).length : 0;
  const totalPurchases = suppliers
    ? Object.values(suppliers).reduce(
        (sum, s: any) => sum + (s.purchases?.length || 0),
        0,
      )
    : 0;

  const averagePurchases =
    totalSuppliers > 0 ? Math.round(totalPurchases as number / totalSuppliers) : 0;

  // أعمدة الجدول
  const supplierColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "phone", label: "الهاتف", sortable: true },
    { key: "balance", label: "الرصيد", sortable: true },
    { key: "purchasesCount", label: "عدد عمليات الشراء", sortable: true },
    { key: "lastUpdate", label: "اخر عملية", sortable: true },
  ];

  // معالجة البيانات لعرض الجدول
  const tableData = suppliers
    ? Object.values(suppliers).map((supplier: any) => ({
        ...supplier,
        purchasesCount: supplier.purchases?.length ?? 0,
      }))
    : [];

  return (
    <DashboardLayout>
      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="إجمالي الموردين"
          value={totalSuppliers}
          icon={Users2}
        />
        <StatsCard
          title="ديون للموردين"
          value={suppliersDebt || 0}
          icon={HandCoins}
        />
        <StatsCard
          title="إجمالي عمليات الشراء"
          value={totalPurchases as any || 0}
          icon={ClipboardList}
        />
        <StatsCard
          title="متوسط عمليات الشراء"
          value={averagePurchases}
          icon={ClipboardList}
        />
      </div>

      {/* حالة التحميل أو الخطأ */}
      {isLoading && (
        <p className="text-center text-gray-500">جاري التحميل...</p>
      )}
      {isError && (
        <p className="text-center text-red-500">
          حدث خطأ أثناء جلب البيانات:{" "}
          {(error as any)?.message || "Unknown error"}
        </p>
      )}

      {/* الجدول */}
      {!isLoading && !isError && (
        <DataTable
          title="الموردين"
          titleButton={
            <PopupForm
              isOpen={openSupplier}
              setIsOpen={setOpenSupplier}
              title="اضافة مورد"
              trigger={<Button className="w-full">اضافة مورد</Button>}
            >
              <SupplierSelect
                className="mt-6"
                isOpen={openSupplier}
                setIsOpen={setOpenSupplier}
                supplierId={supplierId}
                setSupplierId={setSupplierId}
                withDataTable={true}
              />
            </PopupForm>
          }
          columns={supplierColumns}
          data={tableData}
          onRowClick={(row) => {
            navigate("/SupplierDetails", { state: { id: row.id } });
          }}
        />
      )}
    </DashboardLayout>
  );
}
