import { cn } from "@/lib/utils"

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className={cn("rounded-lg border bg-card p-8 text-card-foreground shadow-sm")}>
        <h1 className="text-2xl font-semibold">ANDE CDSS · Gestión</h1>
        <p className="mt-2 text-muted-foreground">Vite + React + Tailwind listos.</p>
      </div>
    </main>
  )
}

export default App
