import React, { useState, useMemo } from "react";
import PopupForm from "../ui/custom/PopupForm";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import { DataTable } from "../dashboard/DataTable";
import CustomerSelect from "../Customers/AddCustomerForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  SellInventoryItemData,
  sellInventoryItems,
} from "@/services/transaction";

interface SellInventoryItemProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  selectedItems: {
    id: string;
    name: string;
    needQty: number;
    costPerUnit: number;
  }[];
  createdBy: string; // معرف المستخدم الذي قام بالبيع
}

export default function SellInventoryItem({
  isOpen,
  setIsOpen,
  selectedItems,
  createdBy,
}: SellInventoryItemProps) {
  const [isDebt, setIsDebt] = useState<"cash" | "part" | "debt">("cash");
  const [partValue, setPartValue] = useState("");
  const [selectIsOpen, setSelectIsOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);

  const queryClient = useQueryClient();

  // حساب المجموع الفرعي
  const subTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) => total + item.costPerUnit * item.needQty,
        0,
      ),
    [selectedItems],
  );

  // المجموع النهائي بعد الخصم
  const total = Math.max(subTotal - discount, 0);

  // قيمة الدفع النهائي حسب نوع الدفع
  const paidAmount = useMemo(() => {
    if (isDebt === "cash") return total;
    if (isDebt === "part") return Number(partValue) || 0;
    return 0; // دين بالكامل
  }, [isDebt, partValue, total]);

  // إعداد الأعمدة للجدول
  const columns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "needQty", label: "الكمية المستخدمة", sortable: true },
    { key: "costPerUnit", label: "سعر الواحدة", sortable: true },
    { key: "cost", label: "السعر النهائي", sortable: true },
  ];

  // Mutation لارسال عملية البيع
  const sellMutation = useMutation({
    mutationFn: (data: SellInventoryItemData) => sellInventoryItems(data),
    onSuccess: () => {
      alert("تم اتمام عملية البيع بنجاح");
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error(error);
      alert(error?.message || "حدث خطأ أثناء عملية البيع");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert("يرجى اختيار العناصر للبيع");
      return;
    }

    if (isDebt === "part" && (!partValue || Number(partValue) <= 0)) {
      alert("يرجى إدخال قيمة الدفعة الجزئية الصحيحة");
      return;
    }

    const payload: SellInventoryItemData = {
      customerId: customerId || undefined,
      createdBy,
      invoiceData: {
        items: selectedItems.map((item) => ({
          itemId: item.id,
          quantity: item.needQty,
          cost: item.costPerUnit,
        })),
        subTotal,
        discount,
        total,
        paidAmount,
        paymentMethod: isDebt === "debt" ? "debt" : "cash",
        notes: note || "",
      },
    };

    sellMutation.mutate(payload);
  };

  return (
    <div>
      <DataTable
        titleButton={
          <Button
            variant="outline"
            className="w-1/4 mr-auto"
            onClick={() => setIsOpen(false)}
          >
            رجوع
          </Button>
        }
        searchable={false}
        defaultPageSize={3}
        title={`المجموع: ${subTotal}`}
        pageSizeOptions={[3]}
        data={
          selectedItems
            ? selectedItems.map((item) => ({
                ...item,
                cost: item.costPerUnit * item.needQty,
              }))
            : []
        }
        columns={columns}
      />

      <form className="space-y-2" onSubmit={handleSubmit}>
        <FormInput
          label="حسم"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />

        <label>المجموع النهائي: {total}</label>

        <div className="grid grid-cols-3 gap-2 md:col-span-2">
          <Button
            onClick={() => setIsDebt("cash")}
            className="col-span-1"
            variant={isDebt === "cash" ? "default" : "outline"}
            type="button"
          >
            نقدا
          </Button>
          <Button
            onClick={() => setIsDebt("part")}
            className="col-span-1"
            variant={isDebt === "part" ? "default" : "outline"}
            type="button"
          >
            جزئي
          </Button>
          <Button
            onClick={() => setIsDebt("debt")}
            className="col-span-1"
            variant={isDebt === "debt" ? "default" : "outline"}
            type="button"
          >
            دين
          </Button>
        </div>

        {isDebt === "part" && (
          <FormInput
            id="partPayment"
            label="قيمة الدفعة"
            type="number"
            value={partValue}
            onChange={(e) => setPartValue(e.target.value)}
          />
        )}

        <CustomerSelect
          isOpen={selectIsOpen}
          setIsOpen={setSelectIsOpen}
          className={""}
          customerId={customerId}
          setCustomerId={setCustomerId}
        />

        <FormInput
          label="ملاحظات"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button
          className="w-full md:col-span-2"
          type="submit"
          disabled={sellMutation.isPending}
        >
          {sellMutation.isPending ? "جاري إتمام البيع..." : "اتمام عملية البيع"}
        </Button>
      </form>

      {sellMutation.isError && (
        <p className="text-red-500 mt-2">
          {(sellMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
