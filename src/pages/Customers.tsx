import CustomerSelect from "@/components/Customers/AddCustomerForm";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import PopupForm from "@/components/ui/custom/PopupForm";
import getAllCustomer from "@/services/customers";
import { useQuery } from "@tanstack/react-query";
import { HandCoins, Users2, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Customers() {
  const navigate = useNavigate();
  const [openCustomer, setOpenCustomer] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // جلب الزبائن
  const {
    data: customers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["customers-table"],
    queryFn: getAllCustomer,
  });

  // حساب الإحصائيات
  const customersDebt = useMemo(
    () =>
      -customers
        ?.filter((s) => s.balance < 0)
        .reduce((sum, s) => sum + Number(s.balance), 0) || 0,
    [customers],
  );

  const totalCustomers = customers ? Object.keys(customers).length : 0;
  const totalPurchases = customers
    ? Object.values(customers).reduce(
        (sum, s: any) => sum + (s.purchases?.length || 0),
        0,
      )
    : 0;

  const averagePurchases =
    totalCustomers > 0
      ? Math.round((totalPurchases as number) / totalCustomers)
      : 0;

  // أعمدة الجدول
  const customerColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "phone", label: "الهاتف", sortable: true },
    { key: "balance", label: "الرصيد", sortable: true },
    { key: "purchasesCount", label: "عدد عمليات الشراء", sortable: true },
    { key: "lastUpdate", label: "اخر عملية", sortable: true },
  ];

  // معالجة البيانات لعرض الجدول
  const tableData = customers
    ? Object.values(customers).map((customer: any) => ({
        ...customer,
        purchasesCount: customer.purchases?.length ?? 0,
      }))
    : [];

  return (
    <DashboardLayout>
      {/* الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="إجمالي الزبائن"
          value={totalCustomers}
          icon={Users2}
        />
        <StatsCard
          title="ديون على الزبائن"
          value={customersDebt || 0}
          icon={HandCoins}
        />
        <StatsCard
          title="إجمالي عمليات الشراء"
          value={(totalPurchases as any) || 0}
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
          title="الزبائن"
          titleButton={
            <PopupForm
              isOpen={openCustomer}
              setIsOpen={setOpenCustomer}
              title="اضافة زبون"
              trigger={<Button className="w-full">اضافة زبون</Button>}
            >
              <CustomerSelect
                className="mt-6"
                isOpen={openCustomer}
                setIsOpen={setOpenCustomer}
                customerId={customerId}
                setCustomerId={setCustomerId}
              />
            </PopupForm>
          }
          columns={customerColumns}
          data={tableData}
          onRowClick={(row) => {
            navigate("/CustomerDetails", { state: { id: row.id } });
          }}
        />
      )}
    </DashboardLayout>
  );
}
