import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
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
import { getTableById, updateTableState } from "@/services/tables";

import { InventoryItem, Order, OrderItem, OrderProducts, Product } from "@/Types/POSTypes";
import { inventoryUser } from "@/components/layout/Header";
import { endOrder } from "@/services/transaction";
import CustomerSelect from "@/components/Customers/AddCustomerForm";
import { getAllProducts } from "@/services/products";
import { Loader2 } from "lucide-react";

export default function TableDetails() {
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderProducts[]>([]);
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

  useEffect(() => {
    const storedUser = localStorage.getItem("InventoryUser");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);


  const { data: tableData, isLoading } = useQuery({
    queryKey: ["tableData", id],
    queryFn: () => getTableById(id),
    enabled: !!id,
  });


  useEffect(()=>{
    console.log(id)
  }, [id])

  const {
    data: orderDetails,
    isLoading: orderDetailsLoading,
    isError,
  } = useQuery({
    queryKey: ["orderDetails", tableData?.currentOrderId],
    queryFn: () => getOrderById(tableData?.currentOrderId),
    enabled: !!tableData?.currentOrderId,
  });

  useEffect(() => {
    console.log("📦 تفاصيل الطلب:", orderDetails);
    if (orderDetails?.items && selectedItems.length === 0) {
      setSelectedItems(orderDetails.items);
      setSelectedProducts(orderDetails.products);
    }
  }, [orderDetails]);

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
      queryClient.invalidateQueries({ queryKey: ["tableData", id] });

    },
    onError: (err: any) => {
      console.error("❌ خطأ أثناء إنهاء الطلب:", err);
      alert(err.message || "حدث خطأ أثناء إنهاء الطلب.");
    },
  });


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
        items: selectedItems,
      },
      createdBy: user?.username || "غير معروف",
      customerId: customerId || "unknown",
      paymentData: {
        isDebt: paymentMethod,
        amount: paidAmount,
        items: selectedItems,
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

    await endOrderMutation.mutateAsync(dataToSend);

    await updateTableState({
      id: tableData.id,
      state: "available",
      note: "تم إنهاء الطلب",
      user: user?.username || "غير معروف",
    });

    queryClient.invalidateQueries({ queryKey: ["tables-table"] });
  };

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

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      alert("⚠️ الرجاء اختيار منتج واحد على الأقل قبل إنشاء الطلب.");
      return;
    }

    const total = Number(amount) - discount;
    const createdAt = new Date().toISOString();

    const orderData: Order = {
      tableId: tableData.id,
      type: "dine-in",
      items: selectedItems,
      products: selectedProducts,
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
    if (selectedItems.length === 0) {
      alert("⚠️ الرجاء اختيار منتج واحد على الأقل قبل تعديل الطلب.");
      return;
    }

    const total = Number(amount) - discount;
    const createdAt = new Date().toISOString();

    const updates: Order = {
      tableId: tableData.id,
      type: "dine-in",
      items: selectedItems,
      products: selectedProducts,
      subTotal: Number(amount), 
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

  const resetForm = () => {
    setAmount("");
    setNote("");
    setSelectedItems([]);
    setDiscount(0);
    setPartValue(0);
    setPaymentMethod("cash");
  };

  if (isLoading){
    return (
      <DashboardLayout>
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }
    return (
      <DashboardLayout>
        <Card dir="rtl" className="max-w-3xl mx-auto mt-6">
          <CardHeader>
            <CardTitle>الطاولة: {tableData?.name}</CardTitle>
            <CardDescription>الحالة: {tableData?.status}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* اختيار المنتجات */}
            <OrderSelect
              setAmount={setAmount}
              onChange={(selected: OrderItem[]) => {
                setSelectedItems(selected);
              }}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              selectedProducts={selectedProducts}
              setSelectedProducts={setSelectedProducts}
            />

            {JSON.stringify(orderDetails?.items) !==
              JSON.stringify(selectedItems) &&
              tableData?.currentOrderId && (
                <Button onClick={() => handleUpdateOrder()}>
                  حفظ التعديلات
                </Button>
              )}

            {/* حالة وجود طلب مفتوح */}
            {tableData?.currentOrderId ? (
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
                  {endOrderMutation.isPending
                    ? "جاري الإنهاء..."
                    : "إنهاء الطلب"}
                </Button>
              </form>
            ) : (
              // حالة إنشاء طلب جديد
              <Button
                className="w-full"
                type="button"
                variant="default"
                onClick={handleCreateOrder}
                disabled={createOrderMutation.isPending}
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
