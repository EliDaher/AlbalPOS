import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import PopupForm from "../ui/custom/PopupForm";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import SupplierSelect from "./SupplierSelect";
import { buyFromSupplier } from "@/services/transaction";
import {
  InventoryItem,
  InventoryLog,
  invoiceData,
  PaymentMode,
} from "@/Types/POSTypes";
import {
  calculatePaymentState,
  formatCurrency,
  validatePaymentSelection,
} from "@/lib/pos";
import { getCurrentUser } from "@/lib/session";

export default function AddItemForm({
  isOpen,
  setIsOpen,
  row,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  row?: InventoryItem;
}) {
  const [openSupplier, setOpenSupplier] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [sellPerUnit, setSellPerUnit] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paidValue, setPaidValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const totalAmount = useMemo(
    () => Number(quantity || 0) * Number(costPerUnit || 0),
    [quantity, costPerUnit],
  );
  const paymentState = calculatePaymentState({
    subTotal: totalAmount,
    mode: paymentMode,
    paidAmount: Number(paidValue || 0),
  });

  useEffect(() => {
    if (row && isOpen) {
      setName(row.name || "");
      setCategory(row.category || "");
      setUnit(row.unit || "");
      setCostPerUnit(String(row.costPerUnit || ""));
      setSellPerUnit(String(row.sellPerUnit || ""));
      setMinQuantity(String(row.minQuantity || ""));
    }
  }, [row, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCategory("");
      setUnit("");
      setQuantity("");
      setCostPerUnit("");
      setSellPerUnit("");
      setMinQuantity("");
      setSupplierId("");
      setPaidValue("");
      setPaymentMode("cash");
      setErrors({});
    }
  }, [isOpen]);

  const buyMutation = useMutation({
    mutationFn: (dataToSend: {
      supplierId: string;
      itemData: InventoryItem;
      logData: InventoryLog;
      invoiceData: invoiceData;
    }) => buyFromSupplier(dataToSend),
    onSuccess: () => {
      toast.success("تم تسجيل الشراء وتحديث المخزون بنجاح");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["items-table"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-table"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: (error) => {
      toast.error((error as Error)?.message || "تعذر تسجيل عملية الشراء");
    },
  });

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "اسم المادة مطلوب";
    if (!category.trim()) nextErrors.category = "التصنيف مطلوب";
    if (!unit.trim()) nextErrors.unit = "الوحدة مطلوبة";
    if (Number(quantity) <= 0) nextErrors.quantity = "الكمية يجب أن تكون أكبر من صفر";
    if (Number(costPerUnit) <= 0) nextErrors.costPerUnit = "سعر الشراء يجب أن يكون أكبر من صفر";
    if (Number(sellPerUnit) <= 0) nextErrors.sellPerUnit = "سعر البيع يجب أن يكون أكبر من صفر";
    if (!supplierId) nextErrors.supplierId = "يجب اختيار المورد";

    const paymentError = validatePaymentSelection({
      mode: paymentMode,
      total: totalAmount,
      paidAmount: Number(paidValue || 0),
      relatedId: supplierId,
    });
    if (paymentError) nextErrors.payment = paymentError;

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    const currentUser = getCurrentUser();
    const itemData: InventoryItem = {
      id: row?.id,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      minQuantity: Number(minQuantity || 0),
      quantity: Number(quantity),
      costPerUnit: Number(costPerUnit),
      sellPerUnit: Number(sellPerUnit),
      lastUpdated: new Date().toISOString(),
    };

    const logData: InventoryLog = {
      itemId: row?.id,
      type: "in",
      quantity: Number(quantity),
      reason: "شراء من المورد",
      createdAt: new Date().toISOString(),
    };

    const invoice: invoiceData = {
      type: "purchase",
      relatedId: supplierId,
      items: [
        {
          itemId: row?.id,
          quantity: Number(quantity),
          cost: Number(costPerUnit),
        },
      ],
      subTotal: paymentState.subTotal,
      discount: 0,
      total: paymentState.total,
      paidAmount: paymentState.paidAmount,
      remainingAmount: paymentState.remainingAmount,
      status: paymentState.status,
      paymentMethod: paymentMode,
      dueDate: new Date().toISOString(),
      createdBy: currentUser?.username || "system",
      notes: "",
    };

    buyMutation.mutate({ supplierId, itemData, logData, invoiceData: invoice });
  };

  return (
    <PopupForm
      title={row ? "إعادة تزويد مادة" : "شراء مادة من مورد"}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={<Button>شراء مادة</Button>}
    >
      <form dir="rtl" className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <FormInput id="productName" label="اسم المادة" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <FormInput id="productCategory" label="التصنيف" value={category} onChange={(e) => setCategory(e.target.value)} error={errors.category} />
        <FormInput id="unit" label="الوحدة" value={unit} onChange={(e) => setUnit(e.target.value)} error={errors.unit} />
        <FormInput id="quantity" label="كمية الشراء" type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} error={errors.quantity} />
        <FormInput id="costPerUnit" label="سعر الشراء للوحدة" type="number" min="0" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} error={errors.costPerUnit} />
        <FormInput id="sellPerUnit" label="سعر البيع للوحدة" type="number" min="0" step="0.01" value={sellPerUnit} onChange={(e) => setSellPerUnit(e.target.value)} error={errors.sellPerUnit} />
        <FormInput id="minQuantity" label="حد التنبيه الأدنى" type="number" min="0" step="0.01" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />

        <SupplierSelect className="md:col-span-2" isOpen={openSupplier} setIsOpen={setOpenSupplier} supplierId={supplierId} setSupplierId={setSupplierId} withDataTable />
        {errors.supplierId && <p className="text-sm text-destructive md:col-span-2">{errors.supplierId}</p>}

        <div className="grid grid-cols-3 gap-2 md:col-span-2">
          {(["cash", "part", "debt"] as PaymentMode[]).map((mode) => (
            <Button key={mode} onClick={() => setPaymentMode(mode)} variant={paymentMode === mode ? "default" : "outline"} type="button">
              {mode === "cash" ? "نقداً" : mode === "part" ? "جزئي" : "دين"}
            </Button>
          ))}
        </div>

        {paymentMode === "part" && (
          <FormInput id="partPayment" label="المبلغ المدفوع" type="number" min="0" step="0.01" value={paidValue} onChange={(e) => setPaidValue(e.target.value)} error={errors.payment} />
        )}

        <div className="rounded-md border bg-muted/40 p-3 text-sm md:col-span-2">
          <div className="flex justify-between"><span>الإجمالي</span><strong>{formatCurrency(paymentState.total)}</strong></div>
          <div className="flex justify-between"><span>المدفوع</span><strong>{formatCurrency(paymentState.paidAmount)}</strong></div>
          <div className="flex justify-between"><span>المتبقي للمورد</span><strong>{formatCurrency(paymentState.remainingAmount)}</strong></div>
        </div>

        <Button className="mt-2 md:col-span-2" type="submit" disabled={buyMutation.isPending}>
          {buyMutation.isPending ? "جار تسجيل العملية..." : "تأكيد الشراء"}
        </Button>
      </form>
    </PopupForm>
  );
}
