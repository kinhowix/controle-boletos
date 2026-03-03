import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Sidebar />

      <div className="flex-1 bg-gray-950">
        <Header />

        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}