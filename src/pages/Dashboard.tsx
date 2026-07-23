import { DataTable } from "@/components/dashboard/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSummary } from "@/services/dashboard";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  Coffee,
  ReceiptText,
  TableIcon,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/pos";

const today = new Date().toISOString().slice(0, 10);

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-summary", today],
    queryFn: () => getDashboardSummary({ from: today, to: today }),
    refetchInterval: 60_000,
  });

  const recentPaymentColumns = [
    { key: "amount", label: "المبلغ", sortable: true },
    { key: "type", label: "النوع", sortable: true, render: (row: any) => row.type === "sale" ? "بيع" : "شراء" },
    { key: "method", label: "الدفع", sortable: true },
    { key: "createdBy", label: "المستخدم", sortable: true },
    { key: "date", label: "الوقت", sortable: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">لوحة اليوم</h1>
            <p className="text-sm text-muted-foreground">
              ملخص سريع لحركة الصالة والصندوق والمخزون
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/tables">فتح الطاولات</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/inventory">المستودع</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="مقبوضات اليوم"
            value={formatCurrency(data?.totals.sales || 0)}
            description="إجمالي دفعات البيع"
            icon={ArrowDown}
          />
          <StatsCard
            title="مدفوعات اليوم"
            value={formatCurrency(data?.totals.purchases || 0)}
            description="إجمالي دفعات الشراء"
            icon={ArrowUp}
          />
          <StatsCard
            title="صافي الصندوق"
            value={formatCurrency(data?.totals.net || 0)}
            description="المقبوضات ناقص المدفوعات"
            icon={WalletCards}
          />
          <StatsCard
            title="طلبات مفتوحة"
            value={data?.orders.open || 0}
            description={`${data?.tables.occupied || 0} طاولات مشغولة`}
            icon={ReceiptText}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="الطاولات المتاحة"
            value={`${data?.tables.available || 0} / ${data?.tables.total || 0}`}
            icon={TableIcon}
          />
          <StatsCard
            title="مواد منخفضة"
            value={data?.inventory.lowStockCount || 0}
            description="تحتاج متابعة"
            icon={AlertTriangle}
          />
          <StatsCard
            title="ديون الزبائن"
            value={formatCurrency(data?.totals.customerDebt || 0)}
            icon={WalletCards}
          />
          <StatsCard
            title="ديون الموردين"
            value={formatCurrency(data?.totals.supplierDebt || 0)}
            icon={Boxes}
          />
        </div>

        {isError && (
          <Card>
            <CardContent className="py-6 text-center text-destructive">
              {(error as any)?.message || "تعذر تحميل ملخص لوحة التحكم"}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>تنبيهات المخزون</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
              {!isLoading && data?.inventory.lowStockItems.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد مواد منخفضة حالياً</p>
              )}
              {data?.inventory.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      الحد الأدنى {item.minQuantity} {item.unit}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-destructive">
                      {item.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الأكثر بيعاً</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
              {!isLoading && data?.topProducts.length === 0 && (
                <p className="text-sm text-muted-foreground">لا توجد مبيعات منتجات بعد</p>
              )}
              {data?.topProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Coffee className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{product.timesSold} مرة</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <DataTable
          title="آخر الدفعات"
          columns={recentPaymentColumns}
          data={data?.recentPayments || []}
          isLoading={isLoading}
          isError={isError}
          defaultPageSize={5}
          pageSizeOptions={[5, 10]}
          exportFilename="دفعات اليوم"
        />
      </div>
    </DashboardLayout>
  );
}
