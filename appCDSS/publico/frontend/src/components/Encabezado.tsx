import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const Encabezado = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-slate-900">MedIAssist</span>
        </Link>
      </div>
    </header>
  );
};

export default Encabezado;
