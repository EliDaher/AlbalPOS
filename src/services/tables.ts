import apiClient from "@/lib/axios";
import { Table } from "@/Types/POSTypes";


export default async function getAllTables() {
  try {
    const response = await apiClient.get("/api/tables");
    
    return response.data;
  } catch (err) {
    console.error("خطأ في جلب البيانات:", err);
    throw new Error;
  }
}

export async function getTableById(id: string) {
  try {
    const response = await apiClient.get(`/api/tables/${id}`);
    return response.data;
  } catch (err) {
    console.error("خطأ في جلب البيانات:", err);
    throw new Error();
  }
}

export async function createTables({table}: {table: Table}) {
  try {
    const response = await apiClient.post("/api/tables", table);

    return response.data;
  } catch (err) {
    console.error("خطأ في اضافة طاولة:", err);
    throw new Error
  }
}

export async function updateTableState({
  id,
  state,
  note,
  user,
}: {
  id: string;
  state: string;
  note: string;
  user: string;
}) {
  try {
    const response = await apiClient.patch(`/api/tables/${id}/State`, {
      status: state,
      note: note,
      user: user,
    });

    return response.data;
  } catch (err) {
    console.error("خطأ في تعديل حالة طاولة:", err);
    throw new Error();
  }
}
