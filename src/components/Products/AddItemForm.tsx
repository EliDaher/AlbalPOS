import React, { useEffect, useState } from "react";
import PopupForm from "../ui/custom/PopupForm";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { buyFromSupplier } from "@/services/transaction";
import SupplierSelect from "./SupplierSelect";
import { InventoryItem, InventoryLog, invoiceData } from "@/Types/POSTypes";
import { toast } from "sonner";

export default function AddItemForm({
  isOpen,
  setIsOpen,
  row,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  row?: any;
}) {
  const [openSupplier, setOpenSupplier] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [sellPerUnit, setSellPerUnit] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [isDebt, setIsDebt] = useState<"cash" | "debt" | "part">("cash");
  const [partValue, setPartValue] = useState("");

  // ⚠️ Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const queryClient = useQueryClient();

  // تعبئة القيم عند وجود row
  useEffect(() => {
    if (row && isOpen) {
      setName(row.name || "");
      setCategory(row.category || "");
      setUnit(row.unit || "");
      setCostPerUnit(row.costPerUnit || 0);
      setSellPerUnit(row.sellPerUnit || 0);
    }
  }, [row, isOpen]);

  // إعادة تعيين الفورم عند الإغلاق
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCategory("");
      setUnit("");
      setQuantity("0");
      setCostPerUnit("0");
      setSellPerUnit("0");
      setSupplierId("");
      setPartValue("0");
      setIsDebt("cash");
      setErrors({});
    }
  }, [isOpen]);

  // 🧩 Mutation لإرسال العملية
  const buyMutation = useMutation({
    mutationFn: (dataToSend: {
      supplierId: string;
      itemData: InventoryItem;
      logData: InventoryLog;
      invoiceData: invoiceData;
    }) => buyFromSupplier(dataToSend),
    onSuccess: () => {
      toast.success(" تم شراء المنتج وتسجيل العملية بنجاح!");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["items-table"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("حدث خطأ أثناء معالجة العملية");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!name) newErrors.name = "⚠️ الرجاء إدخال اسم المنتج";
    if (!category) newErrors.category = "⚠️ الرجاء إدخال الصنف";
    if (!unit) newErrors.unit = "⚠️ الرجاء إدخال الوحدة";
    if (Number(quantity) <= 0)
      newErrors.quantity = "⚠️ الكمية يجب أن تكون أكبر من صفر";
    if (Number(costPerUnit) <= 0)
      newErrors.costPerUnit = "⚠️ سعر الشراء يجب أن يكون أكبر من صفر";
    if (Number(sellPerUnit) <= 0)
      newErrors.sellPerUnit = "⚠️ سعر البيع يجب أن يكون أكبر من صفر";
    if (!supplierId) newErrors.supplierId = "⚠️ الرجاء اختيار المورد";

    if (isDebt === "part") {
      if (Number(partValue) <= 0)
        newErrors.partValue = "⚠️ الدفعة الجزئية يجب أن تكون أكبر من صفر";
      const totalAmount = Number(quantity) * Number(costPerUnit);
      if (Number(partValue) >= totalAmount)
        newErrors.partValue =
          "⚠️ الدفعة الجزئية يجب أن تكون أقل من المجموع الكلي";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) toast.error(JSON.stringify(newErrors));
    if (Object.keys(newErrors).length > 0) return;

    const totalAmount = Number(quantity) * Number(costPerUnit);
    let paidAmount = 0;
    let status: "unpaid" | "partial" | "paid" = "unpaid";

    if (isDebt === "cash") {
      paidAmount = totalAmount;
      status = "paid";
    } else if (isDebt === "part") {
      paidAmount = Number(partValue);
      status = "partial";
    }

    const itemData: InventoryItem = {
      name,
      category,
      unit,
      quantity: Number(quantity),
      costPerUnit: Number(costPerUnit),
      sellPerUnit: Number(sellPerUnit),
      lastUpdated: new Date().toISOString(),
    };

    const logData: InventoryLog = {
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
          quantity: Number(quantity),
          cost: Number(costPerUnit),
        },
      ],
      subTotal: totalAmount,
      discount: 0,
      total: totalAmount,
      paidAmount,
      remainingAmount: totalAmount - paidAmount,
      status,
      paymentMethod:
        isDebt === "cash" ? "cash" : isDebt === "part" ? "part" : "debt",
      dueDate: new Date().toISOString(),
      createdBy: "system",
      notes: "",
    };

    buyMutation.mutate({ supplierId, itemData, logData, invoiceData: invoice });
  };

  return (
    <PopupForm
      title="شراء منتج من مورد"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={<Button>شراء منتج</Button>}
    >
      <form dir="rtl" className="grid grid-cols-2 gap-3">
        <FormInput
          id="productName"
          label="اسم المنتج"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <FormInput
          id="productCategory"
          label="الصنف"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          error={errors.category}
        />
        <FormInput
          id="unit"
          label="الوحدة"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          error={errors.unit}
        />
        <FormInput
          id="quantity"
          label="الكمية"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
        />
        <FormInput
          id="costPerUnit"
          label="سعر الشراء للواحدة"
          type="number"
          value={costPerUnit}
          onChange={(e) => setCostPerUnit(e.target.value)}
          error={errors.costPerUnit}
        />
        <FormInput
          id="sellPerUnit"
          label="سعر البيع للواحدة"
          type="number"
          value={sellPerUnit}
          onChange={(e) => setSellPerUnit(e.target.value)}
          error={errors.sellPerUnit}
        />

        <SupplierSelect
          className="col-span-2"
          isOpen={openSupplier}
          setIsOpen={setOpenSupplier}
          supplierId={supplierId}
          setSupplierId={setSupplierId}
          withDataTable
        />

        {/* خيارات الدفع */}
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <Button
            onClick={() => setIsDebt("cash")}
            variant={isDebt === "cash" ? "default" : "outline"}
            type="button"
          >
            نقدًا
          </Button>
          <Button
            onClick={() => setIsDebt("part")}
            variant={isDebt === "part" ? "default" : "outline"}
            type="button"
          >
            جزئي
          </Button>
          <Button
            onClick={() => setIsDebt("debt")}
            variant={isDebt === "debt" ? "default" : "outline"}
            type="button"
          >
            دين
          </Button>
        </div>

        {isDebt === "part" && (
          <FormInput
            id="partPayment"
            label="قيمة الدفعة الجزئية"
            type="number"
            value={partValue}
            onChange={(e) => setPartValue(e.target.value)}
            error={errors.partValue}
          />
        )}

        <Button
          className="col-span-2 mt-3"
          onClick={(e)=>{
            handleSubmit(e);
          }}
          variant="default"
          disabled={buyMutation.isPending}
        >
          {buyMutation.isPending ? "جاري التحميل ..." : "تأكيد العملية"}
        </Button>
      </form>
    </PopupForm>
  );
}
