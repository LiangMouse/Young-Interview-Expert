import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
