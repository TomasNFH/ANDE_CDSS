import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Pantalla provisoria de gestión: confirma que la sesión llegó desde el login público.
const PaginaInicio = () => {
  const { usuario, logout } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl">ANDE CDSS · Gestión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Sesión iniciada como <span className="font-medium text-foreground">{usuario?.username}</span>{' '}
            ({usuario?.rol})
          </p>
          <Button variant="outline" onClick={logout}>
            <LogOut /> Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default PaginaInicio;
