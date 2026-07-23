import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable } from "../dashboard/DataTable";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import CustomerSelect from "../Customers/AddCustomerForm";
import {
  SellInventoryItemData,
  sellInventoryItems,
} from "@/services/transaction";
import { PaymentMode } from "@/Types/POSTypes";
import {
  calculatePaymentState,
  formatCurrency,
  validatePaymentSelection,
} from "@/lib/pos";

interface SellInventoryItemProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  selectedItems: {
    id: string;
    name: string;
    needQty: number;
    costPerUnit: number;
    quantity?: number;
  }[];
  createdBy: string;
}

export default function SellInventoryItem({
  setIsOpen,
  selectedItems,
  createdBy,
}: SellInventoryItemProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paidValue, setPaidValue] = useState("");
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);

  const queryClient = useQueryClient();

  const subTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + Number(item.costPerUnit || 0) * Number(item.needQty || 0),
        0,
      ),
    [selectedItems],
  );

  const paymentState = calculatePaymentState({
    subTotal,
    discount,
    mode: paymentMode,
    paidAmount: Number(paidValue || 0),
  });

  const rows = selectedItems.map((item) => ({
    ...item,
    lineTotal: Number(item.costPerUnit || 0) * Number(item.needQty || 0),
    remainingStock: Number(item.quantity ?? 0) - Number(item.needQty || 0),
  }));

  const columns = [
    { key: "id", label: "المعرف", sortable: true, hidden: true },
    { key: "name", label: "المادة", sortable: true },
    { key: "needQty", label: "الكمية", sortable: true },
    { key: "costPerUnit", label: "سعر الوحدة", sortable: true },
    { key: "lineTotal", label: "الإجمالي", sortable: true },
    { key: "remainingStock", label: "بعد البيع", sortable: true },
  ];

  const sellMutation = useMutation({
    mutationFn: (data: SellInventoryItemData) => sellInventoryItems(data),
    onSuccess: () => {
      toast.success("تم تسجيل البيع وتحديث المخزون بنجاح");
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["items-table"] });
      queryClient.invalidateQueries({ queryKey: ["customers-table"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error((error as Error)?.message || "تعذر تسجيل عملية البيع");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedItems.length === 0) {
      toast.error("يرجى اختيار مواد للبيع");
      return;
    }
    if (discount < 0 || discount > subTotal) {
      toast.error("الحسم يجب أن يكون بين صفر والإجمالي");
      return;
    }
    const stockIssue = rows.find((item) => item.remainingStock < 0);
    if (stockIssue) {
      toast.error(`الكمية المطلوبة من ${stockIssue.name} أكبر من المخزون`);
      return;
    }
    const paymentError = validatePaymentSelection({
      mode: paymentMode,
      total: paymentState.total,
      paidAmount: Number(paidValue || 0),
      relatedId: customerId,
    });
    if (paymentError) {
      toast.error(paymentError);
      return;
    }

    const payload: SellInventoryItemData = {
      customerId: customerId || undefined,
      createdBy,
      invoiceData: {
        items: selectedItems.map((item) => ({
          itemId: item.id,
          quantity: Number(item.needQty),
          cost: Number(item.costPerUnit),
        })),
        subTotal: paymentState.subTotal,
        discount: paymentState.discount,
        total: paymentState.total,
        paidAmount: paymentState.paidAmount,
        paymentMethod: paymentMode,
        notes: note,
      },
    };

    sellMutation.mutate(payload);
  };

  return (
    <div dir="rtl" className="space-y-4">
      <DataTable
        title={`مواد البيع المباشر: ${formatCurrency(paymentState.total)}`}
        description="يتم خصم هذه الكميات من المخزون فور تأكيد العملية."
        titleButton={
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            رجوع
          </Button>
        }
        searchable={false}
        defaultPageSize={3}
        pageSizeOptions={[3]}
        data={rows}
        columns={columns}
      />

      <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <FormInput
          label="الحسم"
          type="number"
          min="0"
          step="0.01"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />
        <FormInput
          label="ملاحظات"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-2 md:col-span-2">
          {(["cash", "part", "debt"] as PaymentMode[]).map((mode) => (
            <Button
              key={mode}
              onClick={() => setPaymentMode(mode)}
              variant={paymentMode === mode ? "default" : "outline"}
              type="button"
            >
              {mode === "cash" ? "نقداً" : mode === "part" ? "جزئي" : "دين"}
            </Button>
          ))}
        </div>

        {paymentMode === "part" && (
          <FormInput
            id="partPayment"
            label="المبلغ المدفوع"
            type="number"
            min="0"
            step="0.01"
            value={paidValue}
            onChange={(e) => setPaidValue(e.target.value)}
          />
        )}

        {(paymentMode === "part" || paymentMode === "debt") && (
          <CustomerSelect
            isOpen={selectIsOpen}
            setIsOpen={setSelectIsOpen}
            className="md:col-span-2"
            customerId={customerId}
            setCustomerId={setCustomerId}
          />
        )}

        <div className="rounded-md border bg-muted/40 p-3 text-sm md:col-span-2">
          <div className="flex justify-between"><span>الإجمالي قبل الحسم</span><strong>{formatCurrency(paymentState.subTotal)}</strong></div>
          <div className="flex justify-between"><span>الحسم</span><strong>{formatCurrency(paymentState.discount)}</strong></div>
          <div className="flex justify-between"><span>المدفوع</span><strong>{formatCurrency(paymentState.paidAmount)}</strong></div>
          <div className="flex justify-between"><span>المتبقي على الزبون</span><strong>{formatCurrency(paymentState.remainingAmount)}</strong></div>
        </div>

        <Button className="w-full md:col-span-2" type="submit" disabled={sellMutation.isPending}>
          {sellMutation.isPending ? "جار تسجيل البيع..." : "تأكيد البيع"}
        </Button>
      </form>
    </div>
  );
}
