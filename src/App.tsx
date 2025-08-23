import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DiscreetModeProvider } from "@/contexts/DiscreetModeContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Suspense, lazy } from "react";

// Import all pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Capture } from "./pages/Capture";
import { Timeline } from "./pages/Timeline";
import { People } from "./pages/People";
import { PersonDetails } from "./pages/PersonDetails";
import { Categories } from "./pages/Categories";
import { CategoryDetails } from "./pages/CategoryDetails";
import { Trends } from "./pages/Trends";
import { Reflection } from "./pages/Reflection";
import { Streaks } from "./pages/Streaks";
import { YearlyWrap } from "./pages/YearlyWrap";
import { Groups } from "./pages/Groups";
import { Preferences } from "./pages/Preferences";
import { Privacy } from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Development-only imports
const isDev = import.meta.env.MODE !== 'production';
const hasDevParam = () => new URLSearchParams(window.location.search).has('dev');

// Lazy load dev component
const DevRLSCheck = lazy(() => 
  import("./pages/DevRLSCheck").then(module => ({ default: module.DevRLSCheck }))
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DiscreetModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page for non-members */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Development routes */}
            {(isDev || hasDevParam()) && (
              <Route 
                path="/dev/rls-check" 
                element={
                  <AppLayout>
                    <Suspense fallback={<div className="p-6">Loading dev tools...</div>}>
                      <DevRLSCheck />
                    </Suspense>
                  </AppLayout>
                } 
              />
            )}
            
            {/* Protected app routes */}
            <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/capture" element={<AppLayout><Capture /></AppLayout>} />
            <Route path="/timeline" element={<AppLayout><Timeline /></AppLayout>} />
            <Route path="/people" element={<AppLayout><People /></AppLayout>} />
            <Route path="/people/:id" element={<AppLayout><PersonDetails /></AppLayout>} />
            <Route path="/categories" element={<AppLayout><Categories /></AppLayout>} />
            <Route path="/categories/:id" element={<AppLayout><CategoryDetails /></AppLayout>} />
            <Route path="/trends" element={<AppLayout><Trends /></AppLayout>} />
            <Route path="/reflection" element={<AppLayout><Reflection /></AppLayout>} />
            <Route path="/streaks" element={<AppLayout><Streaks /></AppLayout>} />
            <Route path="/yearly-wrap" element={<AppLayout><YearlyWrap /></AppLayout>} />
            <Route path="/groups" element={<AppLayout><Groups /></AppLayout>} />
            <Route path="/preferences" element={<AppLayout><Preferences /></AppLayout>} />
            <Route path="/privacy" element={<AppLayout><Privacy /></AppLayout>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DiscreetModeProvider>
  </QueryClientProvider>
);

export default App;
