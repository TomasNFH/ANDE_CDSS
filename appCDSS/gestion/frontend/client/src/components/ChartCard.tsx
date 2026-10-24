import React from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const ChartCard = ({
  title,
  subtitle,
  children,
  footer,
  className,
}: ChartCardProps) => {
  return (
    <div
      className={cn("bg-white rounded-lg shadow-md overflow-hidden", className)}
      data-id="vx92qkcaw"
      data-path="src/components/ChartCard.tsx"
    >
      <div
        className="p-5 pb-0"
        data-id="ov3apbvua"
        data-path="src/components/ChartCard.tsx"
      >
        <h3
          className="text-lg font-semibold"
          data-id="kdcxivkto"
          data-path="src/components/ChartCard.tsx"
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="text-sm text-gray-500"
            data-id="hysci33we"
            data-path="src/components/ChartCard.tsx"
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="p-3"
        data-id="xkv0tud3y"
        data-path="src/components/ChartCard.tsx"
      >
        {children}
      </div>
      {footer && (
        <div
          className="px-5 py-3 border-t border-gray-100 text-sm"
          data-id="73d6lqgnb"
          data-path="src/components/ChartCard.tsx"
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartCard;
