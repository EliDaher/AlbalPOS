import { customer } from "@/Types/POSTypes";
import apiClient from "@/lib/axios";

export default async function getAllCustomer() {

  try {
    const response = await apiClient.get("/api/customers");
    return response.data
    
  } catch (err) {
    console.error("خطأ في جلب الزبائن:", err);
    throw new Error("خطأ في جلب الزبائن");
  
  }

}
export async function addCustomer({
  name,
  number,
}) {
  try {
    const response = await apiClient.post("/api/customers", {
      name: name,
      phone: number,
      balance: 0,
      notes: "",
    } as customer);
    return response.data
    
  } catch (err) {
    console.error("خطأ في اضافة زبون:", err);
    throw new Error('خطأ في اضافة زبون')
  }
}

export async function getCustomerById({ id }: { id: string }) {
  try {
    const response = await apiClient.get(`/api/customers/${id}`);
    return response.data;
  } catch (err) {
    console.error("خطأ في جلب الزبون:", err);
  }
}

