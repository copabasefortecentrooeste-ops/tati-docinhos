import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomNav from "@/components/layout/BottomNav";
import Index from "./pages/Index";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerProfile from "./pages/CustomerProfile";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminNeighborhoods from "./pages/admin/AdminNeighborhoods";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminHours from "./pages/admin/AdminHours";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";
import AdminCategories from "./pages/admin/AdminCategories";
import StoreLanding from "./pages/StoreLanding";
import ShareableCatalog from "./pages/ShareableCatalog";
import NotFound from "./pages/NotFound";
import PlatformLanding from "@/pages/PlatformLanding";
import MasterAdminLogin from "@/pages/master/MasterAdminLogin";
import MasterAdminLayout from "@/pages/master/MasterAdminLayout";
import MasterDashboard from "@/pages/master/MasterDashboard";
import MasterStores from "@/pages/master/MasterStores";
import MasterConfig from "@/pages/master/MasterConfig";
import { useInitApp } from "@/hooks/useInitApp";

const queryClient = new QueryClient();

// Rotas globais conhecidas (não são slugs de loja)
const NON_SLUG_SEGMENTS = new Set([
  'catalogo', 'produto', 'carrinho', 'checkout', 'confirmacao',
  'acompanhar', 'login', 'minha-conta', 'admin',
]);

function AppInner() {
  useInitApp();
  const location = useLocation();
  const firstSegment = location.pathname.split('/')[1];
  const isSlugRoute = !!firstSegment && !NON_SLUG_SEGMENTS.has(firstSegment);
  // Hide global shell on platform landing, admin routes, and per-store slug routes
  const hideShell = location.pathname === '/' || location.pathname.startsWith('/admin') || isSlugRoute;
  return (
    <>
      {!hideShell && <Header />}
      <Routes>
        <Route path="/" element={<PlatformLanding />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/produto/:id" element={<ProductDetail />} />
        <Route path="/carrinho" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/confirmacao/:code" element={<OrderConfirmation />} />
        <Route path="/acompanhar" element={<OrderTracking />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/minha-conta" element={<CustomerProfile />} />
        <Route path="/admin/login" element={<MasterAdminLogin />} />
        <Route path="/admin" element={<MasterAdminLayout />}>
          <Route index element={<MasterDashboard />} />
          <Route path="lojas" element={<MasterStores />} />
          <Route path="config" element={<MasterConfig />} />
        </Route>
        <Route path="/:slug" element={<StoreLanding />} />
        <Route path="/:slug/cardapio" element={<ShareableCatalog />} />
        <Route path="/:slug/admin/login" element={<AdminLogin />} />
        <Route path="/:slug/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="produtos" element={<AdminProducts />} />
          <Route path="categorias" element={<AdminCategories />} />
          <Route path="bairros" element={<AdminNeighborhoods />} />
          <Route path="cupons" element={<AdminCoupons />} />
          <Route path="horarios" element={<AdminHours />} />
          <Route path="config" element={<AdminConfig />} />
          <Route path="whatsapp" element={<AdminWhatsApp />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideShell && <Footer />}
      {!hideShell && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
