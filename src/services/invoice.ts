import apiClient from "@/lib/axios";

export default async function getInvoiceStats() {

    try {
      const response = await apiClient.get("/api/invoices/stats");
      return response.data
      
    } catch (err) {
      console.error("خطأ :", err);
   
    }

}

export async function getInvoices() {
  try {
    const response = await apiClient.get("/api/invoices/");
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
  }
}