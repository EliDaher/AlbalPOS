import apiClient from "@/lib/axios";

export default async function userLogin({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  try {
    const response = await apiClient.post("/api/auth/login", {
      username,
      password,
    });

    return response.data;
  } catch (err: any) {
    console.error("خطأ في تسجيل الدخول:", err);
    throw new Error(err.response?.data?.error || "فشل تسجيل الدخول");
  }
}
