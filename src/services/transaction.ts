import apiClient from "@/lib/axios";
import { InventoryItem, InventoryLog, invoiceData, Payment } from "@/Types/POSTypes";

export async function payCustomerDebt(dataToSend: {
  customerId: string;
  paymentData: Payment;
  type?: "in" | "out"; // in = قبض من المورد، out = دفع للمورد
}) {
  try {
    // تحقق من نوع العملية (افتراضيًا قبض من المورد)
    const paymentType = dataToSend.type || "in";

    const payload = {
      customerId: dataToSend.customerId,
      type: paymentType,
      paymentData: dataToSend.paymentData,
    };

    const response = await apiClient.post(
      "/api/transaction/customerPayment",
      payload,
    );
    return response.data;
  } catch (err: any) {
    console.error("❌ خطأ أثناء إرسال الدفعة:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}

export async function paySupplierDebt(dataToSend: {
  supplierId: string;
  paymentData: Payment;
  type?: "in" | "out"; // in = قبض من المورد، out = دفع للمورد
}) {
  try {
    // تحقق من نوع العملية (افتراضيًا قبض من المورد)
    const paymentType = dataToSend.type || "in";

    const payload = {
      supplierId: dataToSend.supplierId,
      type: paymentType,
      paymentData: dataToSend.paymentData,
    };

    const response = await apiClient.post(
      "/api/transaction/supplierPayment",
      payload,
    );
    return response.data;
  } catch (err: any) {
    console.error("❌ خطأ أثناء إرسال الدفعة:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}

export interface PurchaseData {
  supplierId: string;
  itemData: InventoryItem;
  logData: InventoryLog;
  invoiceData: invoiceData;
}

/**
 * 🟢 تنفيذ عملية شراء من المورد
 *  - type = "purchase"
 *  - تسجّل العملية في الفواتير والمخزون والقيود المالية
 */
export async function buyFromSupplier(dataToSend: PurchaseData) {
  try {
    const payload = {
      supplierId: dataToSend.supplierId,
      itemData: dataToSend.itemData,
      logData: dataToSend.logData,
      invoiceData: dataToSend.invoiceData
    };

    const response = await apiClient.post(
      "/api/transaction/buyFromSupplier",
      payload,
    );
    return response.data;
  } catch (err: any) {
    console.error("❌ خطأ أثناء تنفيذ عملية الشراء من المورد:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}

export interface SellInventoryItemData {
  customerId?: string; // اختياري، للزبون
  createdBy?: string; // معرف المستخدم
  invoiceData: {
    items: {
      itemId: string;
      quantity: number;
      cost: number;
    }[];
    subTotal?: number;
    discount?: number;
    total?: number;
    paidAmount?: number;
    paymentMethod?: string;
    notes?: string;
  };
}

export async function sellInventoryItems(dataToSend: SellInventoryItemData) {
  try {
    // ✅ بناء الـ payload بشكل صحيح لدالة sellInventoryItems
    const payload = {
      customerId: dataToSend.customerId,
      createdBy: dataToSend.createdBy,
      invoiceData: dataToSend.invoiceData,
    };

    const response = await apiClient.post(
      "/api/transaction/sellItems",
      payload,
    );

    return response.data;
  } catch (err: any) {
    console.error("❌ خطأ أثناء تنفيذ عملية البيع من المخزون:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}

export async function decriseItemQuantity(updates: { id: string; quantity: number }[]) {
  try {
    console.log(updates)
    const response = await apiClient.post(
      "/api/transaction/decriseItemQuantity",
      { items: updates },
    );

    return response.data;
  } catch (err: any) {
    console.error("خطأ أثناء تنفيذ عملية الاخراج من المخزون:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}

export async function endOrder(dataToSend
  /*: {
  tableId: string; // 🟢 معرف الطاولة
  orderData: {
    id: string; // 🟢 رقم الطلب الحالي
    paymentMethod: string; // 🟢 طريقة الدفع
  };
  createdBy: string; // 🟢 المستخدم الذي أنهى الطلب
  customerId: string; // 🟢 الزبون المرتبط بالطلب
  paymentData: {
    isDebt: string; // 🟢 نوع الدفع: cash | debt | part
    amount: number; // 🟢 المبلغ المدفوع (في حالة cash)
    items: any[]; // 🟢 المنتجات
    subTotal: number;
    discount: number;
    total: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate?: string;
    notes?: string;
    note?: string;
  };
}*/) {
  try {
    // ✅ بناء الـ payload بشكل مطابق تمامًا لما يستقبله السيرفر
    const payload = {
      tableId: dataToSend.tableId, // 🟢 معرف الطاولة
      orderData: {
        id: dataToSend.orderData.id, // 🟢 رقم الطلب الحالي
        paymentMethod: dataToSend.orderData.paymentMethod || "cash", // 🟢 طريقة الدفع
        items: dataToSend.orderData.items || [],
      },
      createdBy: dataToSend.createdBy, // 🟢 المستخدم الذي أنهى الطلب
      customerId: dataToSend.customerId, // 🟢 الزبون المرتبط بالطلب
      paymentData: {
        isDebt: dataToSend.paymentData.isDebt, // 🟢 نوع الدفع: cash | debt | part
        amount: dataToSend.paymentData.amount || 0, // 🟢 المبلغ المدفوع (في حالة cash)
        items: dataToSend.paymentData.items || [], // 🟢 المنتجات
        subTotal: dataToSend.paymentData.subTotal || 0,
        discount: dataToSend.paymentData.discount || 0,
        total: dataToSend.paymentData.total || 0,
        paidAmount: dataToSend.paymentData.paidAmount || 0,
        remainingAmount: dataToSend.paymentData.remainingAmount || 0,
        dueDate: dataToSend.paymentData.dueDate || null,
        notes: dataToSend.paymentData.notes || "",
        note: dataToSend.paymentData.note || "",
      },
    };

    const response = await apiClient.post("/api/transaction/end", payload);

    return response.data;
  } catch (err: any) {
    console.error("❌ خطأ أثناء تنفيذ عملية إنهاء الطلب:", err);

    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }

    throw new Error("فشل الاتصال بالسيرفر");
  }
}
