import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Bell, Settings, User, Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const DashboardHeader = () => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const handleLanguageChange = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
    // Here you can add logic to change the actual language of the app
    console.log(`Language changed to: ${newLanguage}`);
  };

  return (
    <div
      className="flex justify-between items-center w-full py-4 px-6"
      data-id="a4glv4qdt"
      data-path="src/components/DashboardHeader.tsx"
    >
      <div data-id="vkvsxiyn9" data-path="src/components/DashboardHeader.tsx">
        <h1
          className="text-xl font-semibold text-gray-800"
          data-id="4il15r3mm"
          data-path="src/components/DashboardHeader.tsx"
        ></h1>
      </div>
      <div
        className="flex items-center space-x-4"
        data-id="kv1eoj6hq"
        data-path="src/components/DashboardHeader.tsx"
      >
        <button
          className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          data-id="rlzeaq06h"
          data-path="src/components/DashboardHeader.tsx"
        >
          <Bell
            size={20}
            data-id="cquiy1sut"
            data-path="src/components/DashboardHeader.tsx"
          />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
              data-id="no3kkw2w1"
              data-path="src/components/DashboardHeader.tsx"
            >
              <Settings
                size={20}
                data-id="qzu80x6ld"
                data-path="src/components/DashboardHeader.tsx"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-medium">Language</span>
              <Globe className="h-4 w-4" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('en')}
              className="flex items-center justify-between"
            >
              <span>English</span>
              {language === 'en' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('es')}
              className="flex items-center justify-between"
            >
              <span>Español</span>
              {language === 'es' && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          data-id="dfj61s3vc"
          data-path="src/components/DashboardHeader.tsx"
        >
          <User
            size={20}
            data-id="ptta0415t"
            data-path="src/components/DashboardHeader.tsx"
          />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
