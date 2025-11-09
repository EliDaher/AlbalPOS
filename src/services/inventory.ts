import apiClient from "@/lib/axios";

export default async function getAllInventoryItems() {

    try {
      const response = await apiClient.get("/api/inventoryItems");
      return response.data
      
    } catch (err) {
      console.error("خطأ :", err);
   
    }

}