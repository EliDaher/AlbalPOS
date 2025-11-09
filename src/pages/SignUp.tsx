// src/pages/SignUp.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignUp = async () => {
    // حفظ البيانات في قاعدة بيانات أو API
    alert("Account created!");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <Input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <Button className="w-full" onClick={handleSignUp}>Create Account</Button>
      </div>
    </div>
  );
}
