import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const isAuth = await isAuthenticated();
  if (!isAuth) redirect("/auth/login");
  return (
    <div>
      <nav>
        <Link href="/dashboard">
          <Image src="/logo.svg" alt="MockMate Logo" width={38} height={32} />
          <h2 className="text-primary-100">小面</h2>
        </Link>
      </nav>
    </div>
  );
};

export default Layout;
