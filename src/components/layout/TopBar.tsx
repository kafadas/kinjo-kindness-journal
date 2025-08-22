import React, { useState } from 'react';
import { Search, Plus, User, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const { session } = useAuth();

  const handleSearchClick = () => {
    navigate('/timeline?filters=true');
  };

  const handleAddClick = () => {
    setIsCaptureModalOpen(true);
  };

  const handleProfileClick = () => {
    navigate('/preferences');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleHelpClick = () => {
    // TODO: Implement help/support modal or page
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center gap-3 px-4">
        {!isMobile && <SidebarTrigger />}
        
        <div className="flex-1" />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClick}
            className="p-2"
          >
            <Search className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleAddClick}
            className="p-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border shadow-md z-50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Account</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || 'No email'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpClick}
            className="p-2"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
      />
    </>
  );
};