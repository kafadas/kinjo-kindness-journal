import React, { useState } from 'react';
import { Search, Plus, User, HelpCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useNavigate } from 'react-router-dom';
import { CaptureModal } from '@/components/modals/CaptureModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  const handleSearchClick = () => {
    navigate('/timeline?filters=true');
  };

  const handleAddClick = () => {
    setIsCaptureModalOpen(true);
  };

  const handleProfileClick = () => {
    navigate('/preferences');
  };

  const handleHelpClick = () => {
    // TODO: Implement help/support modal or page
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProfileClick}
            className="p-2"
          >
            <User className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHelpClick}
            className="p-2"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      <CaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
      />
    </>
  );
};