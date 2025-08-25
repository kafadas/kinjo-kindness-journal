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
import Reflection from "./pages/Reflection";
import { Streaks } from "./pages/Streaks";
import { YearlyWrap } from "./pages/YearlyWrap";
import { Groups } from "./pages/Groups";
import { Preferences } from "./pages/Preferences";
import { Privacy } from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Development-only imports
const isDev = import.meta.env.MODE !== 'production';
const hasDevParam = () => new URLSearchParams(window.location.search).has('dev');

// Lazy load dev components
const DevRLSCheck = lazy(() => 
  import("./pages/DevRLSCheck").then(module => ({ default: module.DevRLSCheck }))
);

const DevSeedData = lazy(() =>
  import("./pages/DevSeedData").then(module => ({ default: module.DevSeedData }))
);

const DevTrendsCheck = lazy(() =>
  import("./pages/DevTrendsCheck").then(module => ({ default: module.DevTrendsCheck }))
);

const DevTrendsAudit = lazy(() =>
  import("./pages/DevTrendsAudit").then(module => ({ default: module.default }))
);

const DevReflectionCheck = lazy(() =>
  import("./pages/DevReflectionCheck").then(module => ({ default: module.default }))
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
              <>
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
                <Route 
                  path="/dev/seed-data" 
                  element={
                    <AppLayout>
                      <Suspense fallback={<div className="p-6">Loading dev tools...</div>}>
                        <DevSeedData />
                      </Suspense>
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/dev/trends-check" 
                  element={
                    <AppLayout>
                      <Suspense fallback={<div className="p-6">Loading dev tools...</div>}>
                        <DevTrendsCheck />
                      </Suspense>
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/dev/trends-audit" 
                  element={
                    <AppLayout>
                      <Suspense fallback={<div className="p-6">Loading dev tools...</div>}>
                        <DevTrendsAudit />
                      </Suspense>
                    </AppLayout>
                  } 
                />
                <Route 
                  path="/dev/reflection-check" 
                  element={
                    <AppLayout>
                      <Suspense fallback={<div className="p-6">Loading dev tools...</div>}>
                        <DevReflectionCheck />
                      </Suspense>
                    </AppLayout>
                  } 
                />
              </>
            )}
            
            {/* Protected app routes */}
            <Route path="/home" element={<AppLayout><Home /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/capture" element={<AppLayout><Capture /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/timeline" element={<AppLayout><Timeline /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/people" element={<AppLayout><People /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/people/:id" element={<AppLayout><PersonDetails /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/categories" element={<AppLayout><Categories /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/categories/:id" element={<AppLayout><CategoryDetails /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/trends" element={<AppLayout><Trends /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/reflection" element={<AppLayout><Reflection /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/streaks" element={<AppLayout><Streaks /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/yearly-wrap" element={<AppLayout><YearlyWrap /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/groups" element={<AppLayout><Groups /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/preferences" element={<AppLayout><Preferences /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            <Route path="/privacy" element={<AppLayout><Privacy /><Suspense fallback={null}><DevTrendsCheck /></Suspense></AppLayout>} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DiscreetModeProvider>
  </QueryClientProvider>
);

export default App;
