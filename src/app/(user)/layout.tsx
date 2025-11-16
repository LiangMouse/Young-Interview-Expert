import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const isAuth = await isAuthenticated();
  if (!isAuth) redirect("/auth/login");
  return (
    <div className="root-layout">
      <nav>
        <Link href="/dashboard" className="flex items-center gap-2 w-fit">
          <Image
            src="/favicon.svg"
            alt="MockMate Logo"
            width={38}
            height={32}
          />
          <h2 className="text-primary-100">小面</h2>
        </Link>
      </nav>
      {children}
    </div>
  );
};

export default Layout;
