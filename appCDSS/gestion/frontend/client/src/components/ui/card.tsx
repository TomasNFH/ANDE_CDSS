import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props} data-id="nab478li1" data-path="src/components/ui/card.tsx" />

);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props} data-id="ofxlbkx04" data-path="src/components/ui/card.tsx" />

);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props} data-id="ovak7x3ts" data-path="src/components/ui/card.tsx" />

);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} data-id="dt2nvwwf8" data-path="src/components/ui/card.tsx" />

);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} data-id="s7sifklzn" data-path="src/components/ui/card.tsx" />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) =>
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props} data-id="y97ga74zj" data-path="src/components/ui/card.tsx" />

);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };