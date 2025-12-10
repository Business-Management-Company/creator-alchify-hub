import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Projects from "./pages/Projects";
import Refiner from "./pages/Refiner";
import RecordingStudio from "./pages/RecordingStudio";
import Library from "./pages/Library";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Transparency from "./pages/Transparency";
import CreatorPublicPage from "./pages/CreatorPublicPage";
import CreatorProfileEditor from "./pages/CreatorProfileEditor";
import Notifications from "./pages/Notifications";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminTechStack from "./pages/admin/AdminTechStack";
import AdminCEOVTO from "./pages/admin/AdminCEOVTO";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminInsightSources from "./pages/admin/AdminInsightSources";
import AdminCFODashboard from "./pages/admin/AdminCFODashboard";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminTaskDetail from "./pages/admin/AdminTaskDetail";
import BoardPortal from "./pages/BoardPortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/refiner" element={<Refiner />} />
              <Route path="/refiner/:projectId" element={<Refiner />} />
              <Route path="/studio" element={<RecordingStudio />} />
              <Route path="/library" element={<Library />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/transparency" element={<Transparency />} />
              <Route path="/notifications" element={<Notifications />} />
              {/* Creator Profile Routes */}
              <Route path="/c/:handle" element={<CreatorPublicPage />} />
              <Route path="/creator/profile" element={<CreatorProfileEditor />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/tech-stack" element={<AdminTechStack />} />
              <Route path="/admin/ceo-vto" element={<AdminCEOVTO />} />
              <Route path="/admin/contacts" element={<AdminContacts />} />
              <Route path="/admin/insight-sources" element={<AdminInsightSources />} />
              <Route path="/admin/cfo-dashboard" element={<AdminCFODashboard />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/tasks/:id" element={<AdminTaskDetail />} />
              {/* Board Portal - Public access for board members */}
              <Route path="/board" element={<BoardPortal />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
