import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
import { createOrder, checkoutOrder, getOrderById, updateOrder } from "@/services/order";
import { getTableById } from "@/services/tables";
import {
  CheckoutPayload,
  Order,
  OrderItem,
  OrderProduct,
} from "@/Types/POSTypes";
import CustomerSelect from "@/components/Customers/AddCustomerForm";
import { Loader2, Save, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/session";
import { calculateOrderTotals, formatCurrency, getProductUnitPrice } from "@/lib/pos";

function normalizeProducts(products: any[] = []): OrderProduct[] {
  return products.map((product) => {
    const unitPrice = Number(product.unitPrice ?? product.total ?? 0);
    const quantity = Number(product.quantity || 0);
    return {
      productId: product.productId,
      productName: product.productName,
      quantity,
      unitPrice,
      total: unitPrice * quantity,
    };
  });
}

export default function TableDetails() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const user = getCurrentUser();

  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([]);
  const [amount, setAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [partValue, setPartValue] = useState(0);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "part" | "debt">(
    "cash",
  );
  const [customerId, setCustomerId] = useState("");
  const [selectOpen, setSelectOpen] = useState("");

  const {
    data: tableData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tableData", id],
    queryFn: () => getTableById(id as string),
    enabled: !!id,
  });

  const { data: orderDetails } = useQuery({
    queryKey: ["orderDetails", tableData?.currentOrderId],
    queryFn: () => getOrderById(tableData?.currentOrderId),
    enabled: !!tableData?.currentOrderId,
  });

  useEffect(() => {
    if (orderDetails?.products && selectedProducts.length === 0) {
      setSelectedProducts(normalizeProducts(orderDetails.products));
      setDiscount(Number(orderDetails.discount || 0));
      setNote(orderDetails.notes || "");
    }
  }, [orderDetails, selectedProducts.length]);

  const totals = useMemo(
    () =>
      calculateOrderTotals({
        products: selectedProducts,
        discount,
        paidAmount: paymentMethod === "cash" ? amount - discount : partValue,
      }),
    [amount, discount, partValue, paymentMethod, selectedProducts],
  );

  const handleItemsChange = useCallback((items: OrderItem[]) => {
    setSelectedItems(items);
  }, []);

  const resetForm = () => {
    setAmount(0);
    setNote("");
    setSelectedItems([]);
    setSelectedProducts([]);
    setDiscount(0);
    setPartValue(0);
    setPaymentMethod("cash");
    setCustomerId("");
  };

  const createOrderMutation = useMutation({
    mutationFn: (orderData: Order) => createOrder({ orderData }),
    onSuccess: () => {
      toast.success("تم إنشاء الطلب بنجاح");
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
      queryClient.invalidateQueries({ queryKey: ["tableData", id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "حدث خطأ أثناء إنشاء الطلب");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, updates }: { orderId: string; updates: Order }) =>
      updateOrder({ id: orderId, updates }),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات بنجاح");
      queryClient.invalidateQueries({
        queryKey: ["orderDetails", tableData?.currentOrderId],
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "حدث خطأ أثناء حفظ التعديلات");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (payload: CheckoutPayload) => checkoutOrder(payload),
    onSuccess: () => {
      toast.success("تم إنهاء الطلب بنجاح");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
      queryClient.invalidateQueries({ queryKey: ["customers-table"] });
      queryClient.invalidateQueries({ queryKey: ["items-table"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems-table"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["tableData", id] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "حدث خطأ أثناء إنهاء الطلب");
    },
  });

  const buildOrderPayload = (): Order => {
    const now = new Date().toISOString();
    return {
      tableId: tableData.id,
      type: "dine-in",
      items: selectedItems,
      products: selectedProducts.map((product) => ({
        ...product,
        total: getProductUnitPrice(product) * product.quantity,
      })),
      subTotal: totals.subTotal,
      discount: totals.discount,
      tax: 0,
      total: totals.total,
      status: "open",
      paymentMethod,
      createdBy: user?.username || "غير معروف",
      notes: note,
      createdAt: orderDetails?.createdAt || now,
      updatedAt: now,
    };
  };

  const validateOrder = () => {
    if (selectedProducts.length === 0) {
      toast.error("الرجاء اختيار منتج واحد على الأقل");
      return false;
    }
    if (totals.discount > totals.subTotal) {
      toast.error("الحسم لا يمكن أن يكون أكبر من الإجمالي");
      return false;
    }
    return true;
  };

  const handleCreateOrder = () => {
    if (!validateOrder()) return;
    createOrderMutation.mutate(buildOrderPayload());
  };

  const handleUpdateOrder = () => {
    if (!validateOrder() || !tableData?.currentOrderId) return;
    updateOrderMutation.mutate({
      orderId: tableData.currentOrderId,
      updates: buildOrderPayload(),
    });
  };

  const handleFinishOrder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!tableData?.currentOrderId) {
      toast.error("لا يوجد طلب مفتوح لهذه الطاولة");
      return;
    }
    if (!validateOrder()) return;
    if (["part", "debt"].includes(paymentMethod) && !customerId) {
      toast.error("اختر زبوناً عند الدفع الجزئي أو الدين");
      return;
    }
    if (paymentMethod === "part" && (partValue <= 0 || partValue >= totals.total)) {
      toast.error("قيمة الدفعة الجزئية يجب أن تكون أكبر من صفر وأقل من الإجمالي");
      return;
    }

    const paidAmount =
      paymentMethod === "cash" ? totals.total : paymentMethod === "part" ? partValue : 0;
    const checkoutTotals = calculateOrderTotals({
      products: selectedProducts,
      discount,
      paidAmount,
    });

    const confirmed = window.confirm(
      `تأكيد إنهاء الطلب بقيمة ${formatCurrency(checkoutTotals.total)}؟`,
    );
    if (!confirmed) return;

    checkoutMutation.mutate({
      tableId: tableData.id,
      orderData: {
        id: tableData.currentOrderId,
        paymentMethod,
        items: selectedItems,
        products: selectedProducts,
      },
      createdBy: user?.username || "غير معروف",
      customerId: customerId || "unknown",
      paymentData: {
        isDebt: paymentMethod,
        amount: paidAmount,
        items: selectedItems,
        subTotal: checkoutTotals.subTotal,
        discount: checkoutTotals.discount,
        total: checkoutTotals.total,
        paidAmount,
        remainingAmount: checkoutTotals.total - paidAmount,
        dueDate: null,
        notes: note,
        note,
        paymentMethod,
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !tableData) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            تعذر تحميل بيانات الطاولة
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const hasOpenOrder = !!tableData.currentOrderId;

  return (
    <DashboardLayout>
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>الطاولة: {tableData.name}</CardTitle>
            <CardDescription>
              الحالة: {hasOpenOrder ? "طلب مفتوح" : "جاهزة لاستقبال طلب"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderSelect
              setAmount={setAmount}
              onChange={handleItemsChange}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              selectedProducts={selectedProducts}
              setSelectedProducts={setSelectedProducts}
            />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              ملخص الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span>الإجمالي</span>
                <span>{formatCurrency(totals.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>الحسم</span>
                <span>{formatCurrency(totals.discount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>الصافي</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {hasOpenOrder && (
              <form className="space-y-4" onSubmit={handleFinishOrder}>
                <FormInput
                  label="الحسم"
                  type="number"
                  min={0}
                  max={totals.subTotal}
                  value={discount}
                  onChange={(event) => setDiscount(Number(event.target.value))}
                />

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                  >
                    نقداً
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
                    className=""
                  />
                )}

                {paymentMethod === "part" && (
                  <FormInput
                    label="قيمة الدفعة الجزئية"
                    type="number"
                    min={1}
                    max={totals.total - 1}
                    value={partValue}
                    onChange={(event) => setPartValue(Number(event.target.value))}
                  />
                )}

                <FormInput
                  label="ملاحظات"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />

                <Button
                  className="w-full"
                  type="submit"
                  loading={checkoutMutation.isPending}
                >
                  إنهاء الطلب
                </Button>
              </form>
            )}

            {!hasOpenOrder ? (
              <Button
                className="w-full"
                type="button"
                onClick={handleCreateOrder}
                loading={createOrderMutation.isPending}
              >
                إنشاء الطلب
              </Button>
            ) : (
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={handleUpdateOrder}
                loading={updateOrderMutation.isPending}
              >
                <Save className="h-4 w-4" />
                حفظ التعديلات
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
