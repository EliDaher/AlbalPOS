import apiClient from "@/lib/axios";

export default async function getAllInventoryItems() {
  try {
    const response = await apiClient.get("/api/inventoryItems");
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function getInventoryItemById(id: string) {
  try {
    const response = await apiClient.get(`/api/inventoryItems/${id}`);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function updateInventoryItem(id: string, data: any) {
  try {
    console.log(data)
    const response = await apiClient.put(`/api/inventoryItems/${id}`, data);
    console.log("تم التحديث :", response);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}
