import React from 'react';
import { 
  Home, 
  Clock, 
  Users, 
  Folder, 
  TrendingUp, 
  BookOpen 
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Timeline', url: '/timeline', icon: Clock },
  { title: 'People', url: '/people', icon: Users },
  { title: 'Categories', url: '/categories', icon: Folder },
  { title: 'Trends', url: '/trends', icon: TrendingUp },
  { title: 'Reflection', url: '/reflection', icon: BookOpen },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 safe-area-pb">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <Button
            key={item.title}
            variant="ghost"
            size="sm"
            asChild
            className={`flex flex-col gap-1 h-auto py-2 px-3 ${
              isActive(item.url) 
                ? 'text-primary' 
                : 'text-muted-foreground'
            }`}
          >
            <NavLink to={item.url}>
              <item.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{item.title}</span>
            </NavLink>
          </Button>
        ))}
      </div>
    </nav>
  );
};