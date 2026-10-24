import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  LayoutDashboard,
  Table,
  FileText,
  LanguagesIcon,
  Bell,
  User,
  LogIn,
  UserPlus,
  Home,
  Wrench,
  ChartNetwork,
  Telescope,
  TelescopeIcon,
  ArrowRightToLine,
  ArrowRightToLineIcon,
  ArrowLeftToLine,
  ArrowLeftToLineIcon,
  InfoIcon,
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href: string;
  collapsed: boolean;
  className?: string;
}

const SidebarItem = ({ icon, label, active, href, collapsed, className }: SidebarItemProps) => {
  return (
    <Link to={href} data-id="62jkd6tdy" data-path="src/components/Sidebar.tsx">
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
          active ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800",
          collapsed ? "justify-center" : "",
          className
        )}
        data-id="eyy2hsnmf"
        data-path="src/components/Sidebar.tsx"
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[20px]">{icon}</div>
            </TooltipTrigger>
            <TooltipContent side="right" align="center">
              {label}
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="text-[20px]">{icon}</div>
        )}
        {!collapsed && (
          <span
            className="text-sm font-medium"
            data-id="ixfc7vh5d"
            data-path="src/components/Sidebar.tsx"
          >
            {label}
          </span>
        )}
      </div>
    </Link>
  );
};

interface SidebarProps {
  bounceAcquisition?: boolean;
}

const Sidebar = ({ bounceAcquisition = false }: SidebarProps) => {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();

  const getActiveItem = () => {
    const path = location.pathname;
    if (path === "/about") return null;
    if (path === "/") return "dashboard";
    if (path === "/acquisition") return "acquisition";
    if (path === "/eda") return "eda";
    if (path === "/automl") return "automl";
    if (path === "/predictions") return "predictions";
    // if (path === "/profile") return "profile";
    return "dashboard";
  };

  const menuItems = [
    {
      id: "dashboard",
      icon: (
        <Home
          size={20}
          data-id="rei3h6bw9"
          data-path="src/components/Sidebar.tsx"
        />
      ),
      label: "Home",
      href: "/",
    },
    {
      id: "acquisition",
      icon: (
        <FileText
          size={20}
          data-id="jno7scguu"
          data-path="src/components/Sidebar.tsx"
        />
      ),
      label: "Acquisition",
      href: "/acquisition",
      bounce: bounceAcquisition,
    },
    {
      id: "eda",
      icon: (
        <Table
          size={20}
          data-id="46g1dk2ad"
          data-path="src/components/Sidebar.tsx"
        />
      ),
      label: "Analysis",
      href: "/eda",
    },
    {
      id: "automl",
      icon: (
        <Wrench
          size={20}
          data-id="yy758bjt2"
          data-path="src/components/Sidebar.tsx"
        />
      ),
      label: "Auto ML",
      href: "/automl",
    },
    {
      id: "predictions",
      icon: (
        <Bell
          size={20}
          data-id="ocsphuuir"
          data-path="src/components/Sidebar.tsx"
        />
      ),
      label: "Predictions",
      href: "/predictions",
    },
    // {
    //   id: "profile",
    //   icon: (
    //     <User
    //       size={20}
    //       data-id="w3sut1uh7"
    //       data-path="src/components/Sidebar.tsx"
    //     />
    //   ),
    //   label: "Profile",
    //   href: "/profile",
    // },
    // {
    //   id: "signin",
    //   icon: <LogIn size={20} data-id="t0rdgm3e3" data-path="src/components/Sidebar.tsx" />,
    //   label: "Sign In",
    //   href: "/signin"
    // },
    // {
    //   id: "signup",
    //   icon: <UserPlus size={20} data-id="c8huihbcs" data-path="src/components/Sidebar.tsx" />,
    //   label: "Sign Up",
    //   href: "/signup"
    // }
  ];

  return (
    <div
      className={cn(
        "bg-[#2D3748] h-screen flex flex-col fixed left-0 top-0 transition-all duration-300 z-40",
        collapsed ? "w-20" : "w-64"
      )}
      data-id="oa7sdo9h3"
      data-path="src/components/Sidebar.tsx"
    >
      <div
        className="p-4 flex-1"
        data-id="mze7amudg"
        data-path="src/components/Sidebar.tsx"
      >
        <div
          className={cn(
            "flex items-center gap-2 mb-0 px-1 transition-all duration-300",
            collapsed ? "justify-center" : "justify-start"
          )}
          data-id="kp57bkpqv"
          data-path="src/components/Sidebar.tsx"
        >
          <div
            className={collapsed ? "h-12 w-12 flex items-center justify-center rounded text-[#FFFFFF]" : "h-12 w-12 flex items-center justify-start rounded text-[#FFFFFF]"}
            data-id="f405gh312"
            data-path="src/components/Sidebar.tsx"
          >
            <img
              src="/miniICON4.png"
              alt="Logo"
              className={collapsed ? "h-40 w-40 object-contain" : "h-12 w-12 object-contain"}
            />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white ml-0">DynamicDSS</span>
          )}
        </div>
        <div className="my-1 border-t border-gray-600" />
        <div
          className="space-y-1"
          data-id="i608v7z5l"
          data-path="src/components/Sidebar.tsx"
        >
          {/* Collapse/Expand button as first menu item */}
          <div onClick={() => setCollapsed((prev) => !prev)}>
            <SidebarItem
              icon={collapsed ? <ArrowRightToLine size={22} color="#fff" /> : <ArrowLeftToLine size={22} color="#fff" />}
              label="Collapse"
              href="#"
              collapsed={collapsed}
              active={false}
            />
          </div>
          {menuItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={getActiveItem() === item.id && getActiveItem() !== null}
              href={item.href}
              collapsed={collapsed}
              data-id="x9m2t5zpm"
              data-path="src/components/Sidebar.tsx"
              className={item.bounce ? 'shake-animate' : ''}
            />
          ))}
        </div>
      </div>
      {/* About Us section at the bottom */}
      <div className={cn("w-full p-2 flex items-center justify-center border-t border-gray-700", collapsed ? "h-16" : "h-20")}
           style={{ minHeight: collapsed ? 48 : 64 }}>
        {collapsed ? (
          <Link to="/about">
            <span className="cursor-pointer" title="About Us">
              <InfoIcon size={22} color="#fff" />
            </span>
          </Link>
        ) : (
          <Link to="/about" className="text-xs text-gray-300 text-center w-full hover:text-white transition-colors">
            <div className="flex items-center justify-center gap-2">
              <InfoIcon size={18} className="inline-block" />
              <span className="font-semibold">About Us</span>
            </div>
            <div>DynamicDSS: Decision Support System for Dynamic Model Selection</div>
          </Link>
        )}
      </div>
      {/* Shake animation style */}
      <style>{`
        .shake-animate {
          animation: shake 1.5s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
