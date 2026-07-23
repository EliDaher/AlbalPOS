import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import userLogin from "@/services/auth";
import { toast } from "sonner";
import { setCurrentUser } from "@/lib/session";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await userLogin({ username, password });

      if (res?.user) {
        setCurrentUser(res.user);
        toast.success("تم تسجيل الدخول بنجاح");
        navigate("/dashboard");
      } else {
        toast.error(res?.error || "فشل تسجيل الدخول");
      }
    } catch (error: any) {
      toast.error(error?.message || "تعذر الاتصال بالخادم");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md space-y-6 rounded-lg p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold">تسجيل الدخول</h2>
          <p className="mt-2 text-sm text-muted-foreground">نظام نقاط البيع عالبال</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="text-right"
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="text-right"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            دخول
          </Button>
        </form>
      </Card>
    </div>
  );
}
