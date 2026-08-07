import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  FolderKanban,
  Users,
  TrendingUp,
  Settings2,
  Hexagon,
  CircleDot,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { currentUser, initialsOf } from "@/lib/mock-data";
import { ROLE_LABEL } from "@/lib/types";

const nav: { title: string; url: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, exact: true },
  { title: "Kanban Board", url: "/board", icon: KanbanSquare },
  { title: "Task Board", url: "/tasks", icon: ListChecks },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "HR Analytics", url: "/analytics", icon: TrendingUp },
  { title: "Admin Controls", url: "/admin", icon: Settings2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/40">
            <Hexagon className="size-5 text-primary" strokeWidth={2.4} />
            <CircleDot className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full bg-sidebar text-mint" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight">CodOps</p>
              <p className="truncate text-[11px] text-muted-foreground">Task & HR Intelligence</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] tracking-[0.14em] uppercase">
              Workspace
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const active = isActive(item.url, item.exact);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="size-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-sidebar-accent/60 p-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/20 text-xs font-bold text-primary">
            {initialsOf(currentUser.full_name ?? currentUser.email)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{currentUser.full_name}</p>
              <p className="truncate text-[10px] font-semibold tracking-wider text-mint">
                {ROLE_LABEL[currentUser.role]}
              </p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
