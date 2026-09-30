import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactRound , BookText} from 'lucide-react';


const PaginaInicio = () => {
  const [nombre_usuario, setNombreUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-52 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 flex flex-col items-center justify-center pb-10 px-8">
          <img
            src={`${import.meta.env.BASE_URL}logo_original.png`}
            alt="Quimiotecas"
            className="h-24 w-auto object-contain mb-6"
          />
          <h1 className="text-6xl font-extrabold mb-12 text-gray-800 tracking-wider">Quimiotecas</h1>
          <div className="flex items-center justify-center w-full">
            <div className="relative w-full max-w-2xl">
              <Input
                placeholder="Buscar compuesto natural"
                value={nombre_usuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                className="w-full h-16 text-xl"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-14 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
              >
                {<BookText className="h-6 w-6" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-transparent"
              >
                {<ContactRound className="h-6 w-6" />}
              </Button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PaginaInicio;
