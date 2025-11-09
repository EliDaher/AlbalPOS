import { Supplier } from "@/Types/POSTypes";
import apiClient from "@/lib/axios";

export default async function getAllSupplier() {

  try {
    const response = await apiClient.get("/api/suppliers");
    return response.data
    
  } catch (err) {
    console.error("خطأ في جلب الموردين:", err);
    throw new Error("خطأ في جلب الموردين");
  
  }

}
export async function addSupplier({
  name,
  number,
}) {
  try {
    const response = await apiClient.post("/api/suppliers", {
      name: name,
      phone: number,
      balance: 0,
      notes: "توريد أسبوعي للدجاج والخبز",
    } as Supplier);
    return response.data
    
  } catch (err) {
    console.error("خطأ في اضافة مورد:", err);
    throw new Error('خطأ في اضافة مورد')
  }
}

export async function getSupplierById({ id }: { id: string }) {
  try {
    const response = await apiClient.get(`/api/suppliers/${id}`);
    return response.data;
  } catch (err) {
    console.error("خطأ في جلب المورد:", err);
  }
}

