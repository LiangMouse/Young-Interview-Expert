import { PageHeader } from "./components/page-header";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen root-layout">
      <PageHeader />
      {children}
    </div>
  );
};

export default Layout;
