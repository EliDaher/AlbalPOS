import apiClient from "@/lib/axios";

export default async function userLogin({username, password}) {

    try {
      const response = await apiClient.post("/api/auth/login", {
        username: username,
        password: password,
        role: 'admin'
      });

      return response.data
      
    } catch (err) {
      console.error("خطأ في تسجيل الدخول:", err);
   
    }

}