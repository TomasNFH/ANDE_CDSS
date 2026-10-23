import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SeccionDesplegableProps {
  titulo: string;
  icono: ReactNode;
  /** Resumen de una línea visible con la sección cerrada. */
  resumen: ReactNode;
  children: ReactNode;
}

const SeccionDesplegable = ({ titulo, icono, resumen, children }: SeccionDesplegableProps) => {
  const [abierta, setAbierta] = useState(false);

  return (
    <Collapsible open={abierta} onOpenChange={setAbierta} asChild>
      <Card className="border-border shadow-sm">
        <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="text-foreground">{icono}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{titulo}</span>
            <span className="block truncate text-sm text-muted-foreground">{resumen}</span>
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {abierta ? "Ocultar" : "Ver detalle"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              abierta && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-5 py-5">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default SeccionDesplegable;
