import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContext, useAuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Catalog from "./pages/Catalog";
import Pricing from "./pages/Pricing";
import Tools from "./pages/Tools";
import Rating from "./pages/Rating";
import Blog from "./pages/Blog";
import Profile from "./pages/Profile";
import Referral from "./pages/Referral";
import Admin from "./pages/Admin";
import AutoLogin from "./pages/AutoLogin";

import PostTool from "./pages/tools/PostTool";
import CarouselTool from "./pages/tools/CarouselTool";
import ScenarioTool from "./pages/tools/ScenarioTool";
import ContentPlanTool from "./pages/tools/ContentPlanTool";
import ProfileTool from "./pages/tools/ProfileTool";
import FunnelTool from "./pages/tools/FunnelTool";
import PresentationTool from "./pages/tools/PresentationTool";
import GuideTool from "./pages/tools/GuideTool";
import ProductCardTool from "./pages/tools/ProductCardTool";
import ReelsTool from "./pages/tools/ReelsTool";
import RouletteTool from "./pages/tools/RouletteTool";
import ImageGenTool from "./pages/tools/ImageGenTool";
import HashtagTool from "./pages/tools/HashtagTool";
import BioTool from "./pages/tools/BioTool";
import RepurposeTool from "./pages/tools/RepurposeTool";

const queryClient = new QueryClient();

function AppRoutes() {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auto-login" element={<AutoLogin />} />

          <Route path="/tools/post" element={<PostTool />} />
          <Route path="/tools/carousel" element={<CarouselTool />} />
          <Route path="/tools/scenario" element={<ScenarioTool />} />
          <Route path="/tools/content-plan" element={<ContentPlanTool />} />
          <Route path="/tools/profile" element={<ProfileTool />} />
          <Route path="/tools/funnel" element={<FunnelTool />} />
          <Route path="/tools/presentation" element={<PresentationTool />} />
          <Route path="/tools/guide" element={<GuideTool />} />
          <Route path="/tools/product-card" element={<ProductCardTool />} />
          <Route path="/tools/reels" element={<ReelsTool />} />
          <Route path="/tools/roulette" element={<RouletteTool />} />
          <Route path="/tools/image-gen" element={<ImageGenTool />} />
          <Route path="/tools/hashtags" element={<HashtagTool />} />
          <Route path="/tools/bio" element={<BioTool />} />
          <Route path="/tools/repurpose" element={<RepurposeTool />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;