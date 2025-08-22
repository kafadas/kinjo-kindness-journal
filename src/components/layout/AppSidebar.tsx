import React from 'react';
import { 
  Home, 
  Clock, 
  Users, 
  Folder, 
  TrendingUp, 
  BookOpen,
  Group
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNavItems = [
  { title: 'Home', url: '/home', icon: Home },
  { title: 'Timeline', url: '/timeline', icon: Clock },
  { title: 'People', url: '/people', icon: Users },
  { title: 'Groups', url: '/groups', icon: Group },
  { title: 'Categories', url: '/categories', icon: Folder },
  { title: 'Trends', url: '/trends', icon: TrendingUp },
  { title: 'Reflection', url: '/reflection', icon: BookOpen },
];

export const AppSidebar: React.FC = () => {
  const { state } = useSidebar();
  const location = useLocation();
  
  const isCollapsed = state === 'collapsed';
  const isActive = (path: string) => location.pathname === path;
  const getNavClass = (path: string) => 
    isActive(path) 
      ? "bg-primary/10 text-primary font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-card">
        <div className="p-6">
          <h1 className="font-display text-2xl font-semibold text-primary">
            {isCollapsed ? 'K' : 'Kinjo'}
          </h1>
          {!isCollapsed && (
            <p className="text-sm text-muted-foreground mt-1">
              Your kindness journal
            </p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClass(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};