import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!isMobile && <AppSidebar />}
        
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
};