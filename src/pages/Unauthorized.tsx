import { Button } from "@/components/ui/button";

// pages/Unauthorized.tsx
export default function UnauthorizedPage() {
  return (
    <div className="text-center mt-10 text-red-600 text-xl flex flex-col items-center justify-center">
      🚫 ليس لديك صلاحية الوصول لهذه الصفحة.
      <Button
        className="w-[40%] mt-4"
        variant="destructive"
        onClick={() => window.history.back()}
      >
        Go Back
      </Button>
    </div>
  );
}
