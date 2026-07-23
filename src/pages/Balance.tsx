import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import getAllCustomer from "@/services/customers";
import getPayments from "@/services/payments";
import getAllSupplier from "@/services/supplier";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowDown, ArrowUp, Box, WalletCards } from "lucide-react";
import { formatCurrency, formatMonthLabel } from "@/lib/pos";
import { Button } from "@/components/ui/button";

export default function Balance() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [typeFilter, setTypeFilter] = useState<"all" | "sale" | "purchase">("all");

  const {
    data: payments = [],
    isLoading,
    isError,
  } = useQuery<any[]>({
    queryKey: ["payments-table"],
    queryFn: getPayments,
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["customers-table"],
    queryFn: getAllCustomer,
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["suppliers-table"],
    queryFn: getAllSupplier,
  });

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const date = new Date(payment.date || 0).toISOString().slice(0, 10);
        const matchesDate = date >= from && date <= to;
        const matchesType = typeFilter === "all" || payment.type === typeFilter;
        return matchesDate && matchesType;
      }),
    [from, payments, to, typeFilter],
  );

  const totalSales = useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.type === "sale")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    [filteredPayments],
  );

  const totalPurchases = useMemo(
    () =>
      filteredPayments
        .filter((payment) => payment.type === "purchase")
        .reduce((sum, payment) => sum + Math.abs(Number(payment.amount || 0)), 0),
    [filteredPayments],
  );

  const chartArray = Object.values(
    filteredPayments.reduce<
      Record<string, { month: string; sales: number; purchases: number }>
    >((acc, payment) => {
      const month = formatMonthLabel(payment.date);
      if (!acc[month]) acc[month] = { month, sales: 0, purchases: 0 };
      if (payment.type === "sale") acc[month].sales += Number(payment.amount || 0);
      else acc[month].purchases += Math.abs(Number(payment.amount || 0));
      return acc;
    }, {}),
  );

  const paymentsWithNames = filteredPayments.map((payment) => {
    const customer = customers.find((item) => item.id === payment.relatedId);
    const supplier = suppliers.find((item) => item.id === payment.relatedId);
    return {
      ...payment,
      typeLabel: payment.type === "sale" ? "بيع" : "شراء",
      relatedName: customer?.name || supplier?.name || "غير معروف",
    };
  });

  const paymentsColumns = [
    { key: "amount", label: "المبلغ", sortable: true },
    { key: "typeLabel", label: "النوع", sortable: true },
    { key: "relatedName", label: "الزبون / المورد", sortable: true },
    { key: "method", label: "طريقة الدفع", sortable: true },
    { key: "note", label: "الملاحظة", sortable: true },
    { key: "createdBy", label: "المستخدم", sortable: true },
    { key: "date", label: "التاريخ", sortable: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">الرصيد والصندوق</h1>
            <p className="text-sm text-muted-foreground">
              تابع المقبوضات والمدفوعات حسب الفترة
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            {[
              ["all", "الكل"],
              ["sale", "بيع"],
              ["purchase", "شراء"],
            ].map(([key, label]) => (
              <Button
                key={key}
                variant={typeFilter === key ? "default" : "outline"}
                onClick={() => setTypeFilter(key as "all" | "sale" | "purchase")}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatsCard title="المقبوضات" icon={ArrowDown} value={formatCurrency(totalSales)} />
          <StatsCard
            title="المدفوعات"
            icon={ArrowUp}
            value={formatCurrency(totalPurchases)}
          />
          <StatsCard
            title="صافي الصندوق"
            icon={WalletCards}
            value={formatCurrency(totalSales - totalPurchases)}
          />
          <StatsCard
            title="عدد الحركات"
            icon={Box}
            value={filteredPayments.length}
          />
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">توزيع الدفعات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" name="المبيعات" fill="hsl(var(--secondary))" />
              <Bar dataKey="purchases" name="المشتريات" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DataTable
          data={paymentsWithNames}
          title="سجل الدفعات"
          columns={paymentsColumns}
          isLoading={isLoading}
          isError={isError}
          exportFilename="سجل الدفعات"
          amountBold
        />
      </div>
    </DashboardLayout>
  );
}
