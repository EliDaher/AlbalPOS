import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import getAllCustomer from "@/services/customers";
import getPayments from "@/services/payments";
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
import { Box } from "lucide-react";

// ✅ أنواع البيانات
interface Payment {
  id: string;
  invoiceId: string;
  type: "purchase" | "sale";
  relatedId: string;
  amount: number;
  method: string;
  date: string;
  note: string;
  createdBy: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export default function Balance() {
  // ✅ جلب البيانات من الـ API
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["payments-table"],
    queryFn: getPayments,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["customers-table"],
    queryFn: getAllCustomer,
  });

  // ✅ اليوم الحالي
  const today = new Date().toISOString().split("T")[0];

  // ✅ المبيعات والمشتريات الكلية
  const totalSales = useMemo(
    () =>
      payments
        .filter((p) => p.type === "sale")
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [payments],
  );

  const totalPurchases = useMemo(
    () =>
      -payments
        .filter((p) => p.type === "purchase")
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [payments],
  );

  // ✅ المبيعات والمشتريات اليومية
  const todaySales = useMemo(
    () =>
      payments
        .filter(
          (p) => p.type === "sale" && p.date.startsWith(today), // مقارنة بالتاريخ فقط
        )
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [payments],
  );

  const todayPurchases = useMemo(
    () =>
      payments
        .filter((p) => p.type === "purchase" && p.date.startsWith(today))
        .reduce((sum, item) => sum + (item.amount || 0), 0),
    [payments],
  );

  // ✅ تجهيز بيانات الرسم البياني الشهري
  const chartData =
    payments.reduce<
      Record<string, { month: string; sales: number; purchases: number }>
    >((acc, p) => {
      const month = new Date(p.date).toLocaleString("ar-SY", {
        month: "short",
        year: "2-digit",
      });
      if (!acc[month]) acc[month] = { month, sales: 0, purchases: 0 };
      if (p.type === "sale") acc[month].sales += p.amount;
      else acc[month].purchases += p.amount;
      return acc;
    }, {}) ?? {};

  const chartArray = Object.values(chartData);

  // ✅ دمج أسماء العملاء أو الموردين حسب الـ relatedId
  const paymentsWithCustomer = payments.map((p) => ({
    ...p,
    customerName:
      customers.find((c) => c.id === p.relatedId)?.name || "غير معروف",
  }));

  // ✅ أعمدة الجدول
  const paymentsColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "amount", label: "المبلغ", sortable: true },
    { key: "note", label: "الملاحظة", sortable: true },
    { key: "method", label: "طريقة الدفع", sortable: true },
    { key: "type", label: "النوع", sortable: true },
    { key: "customerName", label: "العميل / المورد", sortable: true },
    {
      key: "date",
      label: "التاريخ",
      sortable: true,
      render: (row: Payment) =>
        new Date(row.date).toLocaleString("ar-SY", {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6">
        {/* 🧾 الإحصاءات العامة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="إجمالي المبيعات" icon={Box} value={totalSales} />
          <StatsCard
            title="إجمالي المشتريات"
            icon={Box}
            value={totalPurchases}
          />
          <StatsCard
            title="الرصيد الصافي"
            icon={Box}
            value={totalSales - totalPurchases}
          />
        </div>

        {/* 💰 إحصاءات اليوم */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="مقبوضات اليوم" icon={Box} value={todaySales} />
          <StatsCard title="مدفوعات اليوم" icon={Box} value={todayPurchases} />
          <StatsCard
            title="صندوق اليوم"
            icon={Box}
            value={todaySales - todayPurchases}
          />
        </div>

        {/* 📊 الرسم البياني المالي */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-4">
          <h2 className="text-xl font-bold mb-2">توزيع الدفعات الشهرية</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartArray}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="sales"
                name="المبيعات"
                fill="hsl(var(--secondary))"
              />
              <Bar
                dataKey="purchases"
                name="المشتريات"
                fill="hsl(var(--accent))"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🧾 جدول الدفعات */}
        <DataTable
          data={paymentsWithCustomer}
          title="سجل الدفعات"
          columns={paymentsColumns}
        />
      </div>
    </DashboardLayout>
  );
}
