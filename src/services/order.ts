import { Order } from "@/Types/POSTypes";
import apiClient from "@/lib/axios";

/**
 * إنشاء طلب جديد (Order)
 * @param orderData بيانات الطلب المراد إنشاؤه
 * @returns بيانات الطلب الذي تم إنشاؤه من السيرفر
 */
export async function createOrder({ orderData }: { orderData: Order }) {
  try {
    // ✅ تحقق من وجود بيانات أساسية قبل الإرسال
    if (!orderData || !orderData.items || orderData.items.length === 0 || !orderData.products || orderData.products.length === 0) {
      throw new Error("يجب تحديد عناصر الطلب (items) قبل الإرسال.");
    }

    // ✅ تجهيز الطلب قبل الإرسال (ضبط الوقت وتهيئة بعض الحقول)
    const payload = {
      ...orderData,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ✅ تنفيذ الطلب
    const response = await apiClient.post("/api/orders", payload);

    // ✅ في حال نجاح العملية
    return response.data;
  } catch (err: any) {
    console.error("⚠️ خطأ في إضافة الطلب:", err);

    // ✅ معالجة أنواع مختلفة من الأخطاء
    if (err.response) {
      // خطأ من السيرفر (API)
      const message =
        err.response.data?.message ||
        `حدث خطأ من السيرفر (${err.response.status})`;
      throw new Error(message);
    } else if (err.request) {
      // لم يتم استلام أي رد من السيرفر
      throw new Error("تعذر الاتصال بالسيرفر، تحقق من الشبكة.");
    } else {
      // خطأ عام
      throw new Error(err.message || "حدث خطأ غير متوقع أثناء إنشاء الطلب.");
    }
  }
}

export async function updateOrder({ id, updates }: { id: string, updates: any }) {
  try {
    // ✅ تحقق من وجود بيانات أساسية قبل الإرسال
    if (!updates || !updates.items || updates.items.length === 0) {
      throw new Error("يجب تحديد عناصر الطلب (items) قبل الإرسال.");
    }

    // ✅ تجهيز الطلب قبل الإرسال (ضبط الوقت وتهيئة بعض الحقول)
    const payload = {
      ...updates,
      createdAt: updates.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // ✅ تنفيذ الطلب
    const response = await apiClient.patch(`/api/orders/${id}`, payload);

    // ✅ في حال نجاح العملية
    return response.data;
  } catch (err: any) {
    console.error("⚠️ خطأ في إضافة الطلب:", err);

    // ✅ معالجة أنواع مختلفة من الأخطاء
    if (err.response) {
      // خطأ من السيرفر (API)
      const message =
        err.response.data?.message ||
        `حدث خطأ من السيرفر (${err.response.status})`;
      throw new Error(message);
    } else if (err.request) {
      // لم يتم استلام أي رد من السيرفر
      throw new Error("تعذر الاتصال بالسيرفر، تحقق من الشبكة.");
    } else {
      // خطأ عام
      throw new Error(err.message || "حدث خطأ غير متوقع أثناء إنشاء الطلب.");
    }
  }
}

export async function getOrderById(id: string): Promise<Order> {
  try {
    if (!id) throw new Error("لم يتم تمرير معرف الطلب");

    // ✅ يجب أن نستخدم GET وليس POST
    const response = await apiClient.get(`/api/orders/${id}`);

    // ✅ تأكد أن البيانات موجودة
    if (!response.data) {
      throw new Error("الاستجابة فارغة من الخادم");
    }

    return response.data; // ✅ مهم جدًا
  } catch (err: any) {
    console.error("خطأ في جلب بيانات الطلب:", err);
    throw new Error(
      err.response?.data?.message || "فشل في جلب بيانات الطلب من الخادم",
    );
  }
}