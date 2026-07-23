import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormInput from "@/components/ui/custom/FormInput";
import PopupForm from "@/components/ui/custom/PopupForm";
import { Payment } from "@/Types/POSTypes";
import { formatCurrency, describeCustomerBalance, formatDateTime } from "@/lib/pos";
import { getCurrentUser } from "@/lib/session";
import { getCustomerById } from "@/services/customers";
import { payCustomerDebt } from "@/services/transaction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { toast } from "sonner";

function getStateId(state: unknown) {
  if (typeof state === "string") return state;
  if (state && typeof state === "object" && "id" in state) return String((state as { id?: string }).id || "");
  return "";
}

function formatDate(value?: string) {
  return formatDateTime(value);
}

export default function CustomerDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const customerId = getStateId(location.state);
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  const [isOpenPayment, setIsOpenPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-details", customerId],
    queryFn: () => getCustomerById({ id: customerId }),
    enabled: !!customerId,
  });

  const balance = Number(data?.balance || 0);
  const balanceTone = balance < 0 ? "text-destructive" : balance > 0 ? "text-emerald-700" : "text-muted-foreground";

  const payments = useMemo(() => data?.payments || [], [data?.payments]);
  const purchases = useMemo(() => data?.purchases || [], [data?.purchases]);

  const payCustomerDebtMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      paymentData: Payment;
      type?: "in" | "out";
    }) => payCustomerDebt(payload),
    onSuccess: () => {
      toast.success("تم تسجيل دفعة الزبون بنجاح");
      setAmount("");
      setNote("");
      setIsOpenPayment(false);
      queryClient.invalidateQueries({ queryKey: ["customer-details", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers-table"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (err) => {
      toast.error((err as Error)?.message || "تعذر تسجيل الدفعة");
    },
  });

  const handlePayment = (event: React.FormEvent) => {
    event.preventDefault();
    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      toast.error("قيمة الدفعة يجب أن تكون أكبر من صفر");
      return;
    }

    payCustomerDebtMutation.mutate({
      customerId,
      paymentData: {
        type: "sale",
        relatedId: customerId,
        amount: paymentAmount,
        method: "cash",
        note,
        date: new Date().toISOString(),
        createdBy: currentUser?.username || "user",
      },
      type: "in",
    });
  };

  const paymentsColumns = [
    { label: "المعرف", key: "id", hidden: true },
    {
      label: "المبلغ",
      key: "total",
      sortable: true,
      render: (row: any) => formatCurrency(row.total ?? row.amount),
      exportValue: (row: any) => row.total ?? row.amount ?? 0,
    },
    { label: "الوصف", key: "note" },
    {
      label: "التاريخ",
      key: "date",
      sortable: true,
      render: (row: any) => formatDate(row.date),
      exportValue: (row: any) => formatDate(row.date),
    },
  ];

  const purchasesColumns = [
    { label: "المعرف", key: "id", hidden: true },
    { label: "المادة/الطلب", key: "item" },
    { label: "الكمية", key: "itemAmount" },
    {
      label: "الإجمالي",
      key: "total",
      sortable: true,
      render: (row: any) => formatCurrency(row.total),
    },
    {
      label: "التاريخ",
      key: "date",
      sortable: true,
      render: (row: any) => formatDate(row.date),
      exportValue: (row: any) => formatDate(row.date),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">تفاصيل الزبون</h1>
          <Button onClick={() => navigate("/customers")} variant="outline">
            <ArrowLeft className="ml-2 h-4 w-4" /> رجوع
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعلومات والرصيد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : isError || !data ? (
              <p className="text-destructive">{(error as Error)?.message || "تعذر تحميل بيانات الزبون"}</p>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="الاسم" value={data.name || "-"} />
                  <InfoRow label="الهاتف" value={data.phone || "-"} />
                  <InfoRow label="تاريخ التسجيل" value={formatDate(data.createdAt)} />
                  <InfoRow label="آخر تحديث" value={formatDate(data.lastUpdate)} />
                  <InfoRow label="ملاحظات" value={data.notes || "-"} />
                  <div className="rounded-md border p-3">
                    <p className="text-sm text-muted-foreground">الرصيد</p>
                    <p className={`mt-1 text-xl font-bold ${balanceTone}`}>
                      {describeCustomerBalance(balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      الرصيد السالب يعني ديناً على الزبون.
                    </p>
                  </div>
                </div>

                <PopupForm
                  title="قبض دفعة من الزبون"
                  trigger={
                    <Button variant="accent" onClick={() => setIsOpenPayment(true)}>
                      قبض دفعة
                    </Button>
                  }
                  isOpen={isOpenPayment}
                  setIsOpen={setIsOpenPayment}
                >
                  <form className="space-y-4" onSubmit={handlePayment} dir="rtl">
                    <FormInput label="قيمة الدفعة" id="payment-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <FormInput label="ملاحظات" id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button type="submit" className="w-full" disabled={payCustomerDebtMutation.isPending}>
                      {payCustomerDebtMutation.isPending ? "جار تسجيل الدفعة..." : "تأكيد الدفعة"}
                    </Button>
                  </form>
                </PopupForm>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <DataTable
            title="دفعات الزبون"
            columns={paymentsColumns}
            data={payments}
            isLoading={isLoading}
            exportFilename={`دفعات-${data?.name || "زبون"}`}
          />
          <DataTable
            title="مبيعات وديون الزبون"
            columns={purchasesColumns}
            data={purchases}
            isLoading={isLoading}
            exportFilename={`مبيعات-${data?.name || "زبون"}`}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
