import apiClient from "@/lib/axios";

export default async function addProduct(data) {

    try {
      const response = await apiClient.post("/api/products", data);
      return response.data
      
    } catch (err) {
      console.error("خطأ :", err);
   
    }

}