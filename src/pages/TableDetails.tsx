import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import OrderSelect from "@/components/Tables/OrderSelect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormInput from "@/components/ui/custom/FormInput";

import getAllInventoryItems from "@/services/inventory";
import { createOrder, getOrderById, updateOrder } from "@/services/order";
import { updateTableState } from "@/services/tables";

import { InventoryItem, Order } from "@/Types/POSTypes";
import { inventoryUser } from "@/components/layout/Header";
import { endOrder } from "@/services/transaction";
import CustomerSelect from "@/components/Customers/AddCustomerForm";

export default function TableDetails() {
  const location = useLocation();
  const tableData = location.state;
  const queryClient = useQueryClient();

  const [selectedProducts, setSelectedProducts] = useState<InventoryItem[]>([]);
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState(0);
  const [partValue, setPartValue] = useState(0);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "part" | "debt">(
    "cash",
  );
  const [user, setUser] = useState<inventoryUser | null>(null);
  const [customerId, setCustomerId] = useState('')
  const [selectOpen, setSelectOpen] = useState('')

  // ✅ جلب المستخدم من التخزين المحلي
  useEffect(() => {
    const storedUser = localStorage.getItem("InventoryUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // ✅ جلب جميع المنتجات
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products-table"],
    queryFn: getAllInventoryItems,
  });

  // ✅ جلب تفاصيل الطلب الحالي (إن وجد)
  const {
    data: orderDetails,
    isLoading: orderDetailsLoading,
    isError,
  } = useQuery({
    queryKey: ["orderDetails", tableData.currentOrderId],
    queryFn: () => getOrderById(tableData.currentOrderId),
    enabled: !!tableData.currentOrderId,
  });

  // ✅ تحميل عناصر الطلب في حالة وجود طلب مفتوح
  useEffect(() => {
    if (orderDetails?.items && selectedProducts.length === 0) {
      setSelectedProducts(orderDetails.items as any);
    }
  }, [orderDetails]);

  // ✅ إنشاء طلب جديد
  const createOrderMutation = useMutation({
    mutationFn: (orderData: Order) => createOrder({ orderData }),
    onSuccess: () => {
      alert("✅ تمت إضافة الطلب بنجاح!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
    },
    onError: (err) => {
      console.error("❌ خطأ أثناء إنشاء الطلب:", err);
      alert("حدث خطأ أثناء إنشاء الطلب.");
    },
  });

  const endOrderMutation = useMutation<void, any, any>({
    mutationFn: (dataToSend: any) => endOrder(dataToSend),
    onSuccess: () => {
      alert("✅ تم إنهاء الطلب بنجاح!");
      resetForm();
      
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
      queryClient.invalidateQueries({ queryKey: ["customers-table"] });
      
    },
    onError: (err: any) => {
      console.error("❌ خطأ أثناء إنهاء الطلب:", err);
      alert(err.message || "حدث خطأ أثناء إنهاء الطلب.");
    },
  });


  // ✅ إنهاء الطلب (دفع أو دين)
  const handleFinishOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tableData.currentOrderId) {
      alert("⚠️ لا يوجد طلب مفتوح لهذه الطاولة.");
      return;
    }

    if (paymentMethod === "part" && partValue <= 0) {
      alert("⚠️ أدخل قيمة الدفعة الجزئية.");
      return;
    }

    const subTotal = Number(amount) || 0;
    const total = subTotal - discount;
    const paidAmount =
      paymentMethod === "cash"
        ? total
        : paymentMethod === "part"
          ? partValue
          : 0;
    const remainingAmount = total - paidAmount;

    // ✅ بناء البيانات للإرسال
    const dataToSend = {
      tableId: tableData.id,
      orderData: {
        id: tableData.currentOrderId,
        paymentMethod,
      },
      createdBy: user?.username || "غير معروف",
      customerId: customerId || "unknown",
      paymentData: {
        isDebt: paymentMethod,
        amount: paidAmount,
        items: selectedProducts,
        subTotal: amount,
        discount,
        total,
        paidAmount,
        remainingAmount,
        dueDate: null,
        notes: note,
        note,
      },
    };

    console.log("📦 البيانات المرسلة لإنهاء الطلب:", dataToSend);

    // ✅ إرسال الطلب إلى السيرفر
    await endOrderMutation.mutateAsync(dataToSend);

    // ✅ تحديث حالة الطاولة بعد الإنهاء
    await updateTableState({
      id: tableData.id,
      state: "available",
      note: "تم إنهاء الطلب",
      user: user?.username || "غير معروف",
    });

    queryClient.invalidateQueries({ queryKey: ["tables-table"] });
  };

  // ✅ تحديث الطلب الحالي
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateOrder({ id, updates }),
    onSuccess: () => {
      alert("✅ تم حفظ التعديلات بنجاح!");
      queryClient.invalidateQueries({
        queryKey: ["orderDetails", tableData.currentOrderId],
      });
    },
    onError: (err) => {
      console.error("❌ خطأ أثناء التعديل:", err);
      alert("حدث خطأ أثناء حفظ التعديلات.");
    },
  });

  // ✅ إنشاء الطلب
  const handleCreateOrder = async () => {
    if (productsLoading) {
      alert("المنتجات مازالت قيد التحميل...");
      return;
    }
    if (selectedProducts.length === 0) {
      alert("⚠️ الرجاء اختيار منتج واحد على الأقل قبل إنشاء الطلب.");
      return;
    }

    const total = Number(amount) - discount;
    const createdAt = new Date().toISOString();

    const orderData: Order = {
      tableId: tableData.id,
      type: "dine-in",
      items: selectedProducts as any,
      subTotal: Number(amount), // ⚠️ لم نغير طريقة الحساب كما طلبت
      discount,
      tax: 0,
      total,
      status: "open",
      paymentMethod,
      createdBy: user?.username || "غير معروف",
      notes: note,
      createdAt,
      updatedAt: createdAt,
    };

    createOrderMutation.mutate(orderData);
  };

  const handleUpdateOrder = async () => {
    if (productsLoading) {
      alert("المنتجات مازالت قيد التحميل...");
      return;
    }
    if (selectedProducts.length === 0) {
      alert("⚠️ الرجاء اختيار منتج واحد على الأقل قبل تعديل الطلب.");
      return;
    }

    const total = Number(amount) - discount;
    const createdAt = new Date().toISOString();

    const updates: Order = {
      tableId: tableData.id,
      type: "dine-in",
      items: selectedProducts as any,
      subTotal: Number(amount), // ⚠️ لم نغير طريقة الحساب كما طلبت
      discount,
      tax: 0,
      total,
      status: "open",
      paymentMethod,
      createdBy: user?.username || "غير معروف",
      notes: note,
      createdAt,
      updatedAt: createdAt,
    };

    updateOrderMutation.mutate({ id: tableData.currentOrderId, updates });
  };

  // ✅ إعادة تعيين الحقول بعد الإنشاء
  const resetForm = () => {
    setAmount("");
    setNote("");
    setSelectedProducts([]);
    setDiscount(0);
    setPartValue(0);
    setPaymentMethod("cash");
  };

  return (
    <DashboardLayout>
      <Card dir="rtl" className="max-w-3xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>الطاولة: {tableData.name}</CardTitle>
          <CardDescription>الحالة: {tableData.status}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* اختيار المنتجات */}
          <OrderSelect
            products={products || []}
            setAmount={setAmount}
            onChange={(selected) => setSelectedProducts(selected as any)}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
          />

          {JSON.stringify(orderDetails?.items) !==
            JSON.stringify(selectedProducts) && tableData.currentOrderId && (
            <Button onClick={() => handleUpdateOrder()}>حفظ التعديلات</Button>
          )}

          {/* حالة وجود طلب مفتوح */}
          {tableData.currentOrderId ? (
            <form className="space-y-4 mt-4" onSubmit={handleFinishOrder}>
              <div className="flex justify-between">
                <FormInput
                  label="الحسم"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
                <FormInput 
                  className=""
                  label="المبلغ النهائي "  
                  value={Number(amount) - discount}
                />
              </div>

              {/* خيارات الدفع */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("cash")}
                >
                  نقدًا
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "part" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("part")}
                >
                  جزئي
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "debt" ? "default" : "outline"}
                  onClick={() => setPaymentMethod("debt")}
                >
                  دين
                </Button>
              </div>

              {["debt", "part"].includes(paymentMethod) && (
                <CustomerSelect
                  isOpen={selectOpen}
                  setIsOpen={setSelectOpen}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  className={""}
                />
              )}

              {paymentMethod === "part" && (
                <FormInput
                  label="قيمة الدفعة الجزئية"
                  type="number"
                  value={partValue.toString()}
                  onChange={(e) => setPartValue(Number(e.target.value))}
                />
              )}

              <FormInput
                label="ملاحظات"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <Button
                className="w-full"
                type="submit"
                variant="default"
                disabled={endOrderMutation.isPending}
              >
                {endOrderMutation.isPending ? "جاري الإنهاء..." : "إنهاء الطلب"}
              </Button>
            </form>
          ) : (
            // حالة إنشاء طلب جديد
            <Button
              className="w-full"
              type="button"
              variant="default"
              onClick={handleCreateOrder}
              disabled={createOrderMutation.isPending || productsLoading}
            >
              {createOrderMutation.isPending
                ? "جاري الإنشاء..."
                : "إنشاء الطلب"}
            </Button>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
