import apiClient from "@/lib/axios";
import { Product } from "@/Types/POSTypes";

export default async function createNewProduct(data: Product) {
  try {
    const response = await apiClient.post("/api/products", data);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function getAllProducts() {
  try {
    const response = await apiClient.get("/api/products");
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function getProductById(id: string) {
  try {
    console.log(id);
    const response = await apiClient.get(`/api/products/${id}`);
    console.log("المنتج :", response.data);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function updateProduct(id: string, data: any) {
  try {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}

export async function deleteProduct(id: string) {
  try {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  } catch (err) {
    console.error("خطأ :", err);
    throw err;
  }
}
