import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/custom/FormInput";
import PopupForm from "@/components/ui/custom/PopupForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomerById } from "@/services/customers";
import { payCustomerDebt } from "@/services/transaction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Skeleton from "@mui/material/Skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Payment } from "@/Types/POSTypes";
import { inventoryUser } from "@/components/layout/Header";
import { toast } from "sonner";

export default function CustomerDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const customerId = location.state;
  const queryClient = useQueryClient();

  // حالات الفورم
  const [isOpenPayment, setIsOpenPayment] = useState(false);
  const [isOpenReturn, setIsOpenReturn] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState('')
  const [returnAmount, setReturnAmount] = useState(0);
  const [isDebt, setIsDebt] = useState<"cash" | "part" | "debt">("cash");
  const [partValue, setPartValue] = useState(0);
  const [reason, setReason] = useState("");
  const [inventoryUser, setInventoryUser] = useState<inventoryUser>();
  
  
  useEffect(()=>{
    const temUser = JSON.parse(localStorage.getItem("InventoryUser") || "null");
    setInventoryUser(temUser)
  },[])

  // جلب بيانات المورد
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-details", customerId],
    queryFn: () => getCustomerById(customerId),
    enabled: !!customerId,
  });

  // mutations
  const payCustomerDebtMutation = useMutation({
    mutationFn: (payload: {
      customerId: string;
      paymentData: Payment;
      type?: "in" | "out";
    }) => payCustomerDebt(payload),
    onSuccess: () => {
      toast.success("تمت إضافة الدفعة بنجاح!");
      setAmount("");
      setNote("");
      setIsOpenPayment(false);
      queryClient.invalidateQueries({
        queryKey: ["customer-details", customerId],
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("حدث خطأ أثناء الدفع");
    },
  });

  const returnMutation = useMutation({
    mutationFn: (payload: any) => (payload),
    onSuccess: () => {
      toast.success("تم الإرجاع بنجاح!");
      setReturnAmount(0);
      setIsOpenReturn(false);
      queryClient.invalidateQueries({
        queryKey: ["customer-details", customerId],
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("حدث خطأ أثناء الإرجاع");
    },
  });

  const handleReturn = (e: React.FormEvent, row: any) => {
    e.preventDefault();
    returnMutation.mutate({
      productCode: row.code,
      customerId: row.customerId,
      warehouse: row.warehouse,
      qty: returnAmount,
      returnType: isDebt,
      returnValue: returnAmount * row.payPrice,
      referenceId: row.id,
      productId: row.id,
      partValue,
      reason,
    });
  };

  const paymentsColumns = [
    { label: "المعرف", key: "id", hidden: true },
    { label: "المبلغ", key: "total", sortable: true },
    { label: "الوصف", key: "note" },
    { label: "التاريخ", key: "date", sortable: true },
  ];

  const purchasesColumns = [
    { label: "المعرف", key: "id", hidden: true },
    { label: "اسم المادة", key: "item" },
    { label: "الكمية", key: "itemAmount" },
    { label: "السعر", key: "total", sortable: true },
    { label: "التاريخ", key: "date", sortable: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">بيانات المورد</h1>
          <Button onClick={() => navigate("/customers")} variant="outline">
            <ArrowLeft className="ml-2 w-4 h-4" /> رجوع
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : isError ? (
              <p className="text-red-500">
                {(error as any)?.message || "حدث خطأ"}
              </p>
            ) : (
              Object.entries(data)
                .filter(
                  ([key]) => !["payments", "purchases", "id"].includes(key),
                )
                .map(([key, value]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <label className="font-bold w-36">
                        {
                            key == 'balance' ? 'الرصيد' : 
                            key == 'createdAt' ? 'تاريخ التسجيل' :
                            key == 'lastUpdate' ? 'اخر تعديل' :
                            key == 'name' ? 'الاسم' :
                            key == 'notes' ? 'ملاحظات' :
                            key == 'phone' ? 'الرقم' 
                            :key 
                        }:
                    </label>
                    <span>
                      {key.includes("date")
                        ? new Date(value as string).toLocaleString()
                        : (value as string)}
                    </span>
                  </div>
                ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-4">
            {/* دفعة من الزبون */}
            <PopupForm
              title="دفعة من الزبون"
              trigger={
                <Button variant="accent" onClick={() => setIsOpenPayment(true)}>
                  دفعة من الزبون
                </Button>
              }
              isOpen={isOpenPayment}
              setIsOpen={setIsOpenPayment}
            >
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  payCustomerDebtMutation.mutate({
                    customerId: customerId.id,
                    paymentData: {
                      type: "purchase",
                      relatedId: customerId.id,
                      amount: Number(amount),
                      method: "cash",
                      note: note,
                      date: date,
                      createdBy: inventoryUser.username || "user",
                    },
                    type: "in",
                  });
                }}
              >
                <FormInput
                  label="قيمة الدفعة"
                  id="payment-amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <FormInput
                  label="ملاحظات"
                  id="note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {/* <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="العملة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SYP">SYP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
                {currency === "SYP" && (
                  <FormInput
                    label="سعر الصرف"
                    id="exchangeRate"
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                  />
                )} */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={payCustomerDebtMutation.isPending}
                >
                  {
                    payCustomerDebtMutation.isPending ? "جاري الدفع..." : "دفعة من الزبون"
                  }
                </Button>
              </form>
            </PopupForm>
          </div>
        </Card>

        {/* معاملات المورد */}
        <Card className="overflow-x-auto">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : data?.payments?.length === 0 && data?.purchases?.length === 0 ? (
            <p className="text-center text-gray-500">لا توجد معاملات حالياً</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <DataTable
                title="الدفعات"
                columns={paymentsColumns}
                data={data?.payments || []}
              />
              <DataTable
                title="عمليات الشراء"
                columns={purchasesColumns}
                data={data?.purchases || []}
                // renderRowActions={(row) => (
                //   <PopupForm
                //     title={`إرجاع منتج: ${row.item}`}
                //     isOpen={isOpenReturn}
                //     setIsOpen={setIsOpenReturn}
                //     trigger={
                //       <Button onClick={() => setIsOpenReturn(true)}>
                //         إرجاع
                //       </Button>
                //     }
                //   >
                //     <form
                //       className="space-y-4"
                //       onSubmit={(e) => handleReturn(e, row)}
                //     >
                //       <FormInput
                //         label="الكمية"
                //         type="number"
                //         value={returnAmount}
                //         onChange={(e) =>
                //           setReturnAmount(Number(e.target.value))
                //         }
                //       />
                //       <div className="flex gap-2">
                //         <Button
                //           variant={isDebt === "cash" ? "default" : "outline"}
                //           type="button"
                //           onClick={() => setIsDebt("cash")}
                //         >
                //           نقدا
                //         </Button>
                //         <Button
                //           variant={isDebt === "part" ? "default" : "outline"}
                //           type="button"
                //           onClick={() => setIsDebt("part")}
                //         >
                //           جزئي
                //         </Button>
                //         <Button
                //           variant={isDebt === "debt" ? "default" : "outline"}
                //           type="button"
                //           onClick={() => setIsDebt("debt")}
                //         >
                //           دين
                //         </Button>
                //       </div>
                //       {isDebt === "part" && (
                //         <FormInput
                //           label="قيمة الدفعة"
                //           type="number"
                //           value={partValue}
                //           onChange={(e) => setPartValue(Number(e.target.value))}
                //         />
                //       )}
                //       <FormInput
                //         label="ملاحظات"
                //         type="text"
                //         value={reason}
                //         onChange={(e) => setReason(e.target.value)}
                //       />
                //       <Button type="submit" className="w-full">
                //         تأكيد الإرجاع
                //       </Button>
                //     </form>
                //   </PopupForm>
                // )}
              />
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
