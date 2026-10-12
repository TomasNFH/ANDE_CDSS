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
      <Card className="border-slate-200 shadow-sm">
        <CollapsibleTrigger className="flex w-full items-center gap-3 rounded-xl px-5 py-4 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600">
          <span className="text-slate-500">{icono}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-900">{titulo}</span>
            <span className="block truncate text-sm text-slate-500">{resumen}</span>
          </span>
          <span className="hidden text-sm text-slate-500 sm:inline">
            {abierta ? "Ocultar" : "Ver detalle"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-500 transition-transform",
              abierta && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-slate-100 px-5 py-5">{children}</div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default SeccionDesplegable;
