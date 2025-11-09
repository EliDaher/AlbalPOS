import apiClient from "@/lib/axios";

export default async function getPayments() {

    try {
      const response = await apiClient.get("/api/payments/");
      return response.data
      
    } catch (err) {
      console.error("خطأ :", err);
   
    }

}