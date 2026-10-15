import Logo from '@/components/Logo';
import FormularioIngreso from '@/components/FormularioIngreso';

// Cantidad de modelos abiertos que se muestran en la portada (provisorio, hasta leerlo del backend).
const MODELOS_ABIERTOS = 1;

// Arcos decorativos del panel izquierdo.
const ArcosFondo = () => (
  <svg
    className="pointer-events-none absolute inset-0 h-full w-full"
    viewBox="0 0 600 800"
    preserveAspectRatio="xMidYMid slice"
    fill="none"
    aria-hidden="true"
  >
    {[0, 1, 2, 3, 4].map((i) => (
      <path
        key={i}
        d={`M ${-80 + i * 20} 820 Q ${300 + i * 40} ${560 - i * 20} ${340 + i * 40} ${40 + i * 60}`}
        stroke="white"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
    ))}
  </svg>
);

const PaginaBienvenida = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 to-blue-900 px-6 py-10 text-white sm:px-12 lg:w-[58%] lg:px-20 lg:py-16">
        <ArcosFondo />

        <div className="relative max-w-xl space-y-8 lg:mt-16">
          <Logo className="h-28 w-28" color="white" />

          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            Te damos la bienvenida a MedIAssist
          </h1>

          <p className="text-lg text-blue-50 sm:text-xl">
            Este trabajo presenta el desarrollo de un sistema dinámico de apoyo a la decisión
            clínica (CDSS) que incorpora la selección dinámica de modelos de aprendizaje
            automático adaptados a datos médicos, con una aplicación específica a datos de
            diálisis en nefrología.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm text-blue-50">
              <span className="h-2 w-2 rounded-full bg-white" />
              Modelos abiertos disponibles:{' '}
              <span className="font-semibold text-white">{MODELOS_ABIERTOS}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/40 px-4 py-1.5 text-sm text-blue-50">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
              En desarrollo: estamos sumando más modelos
            </div>
          </div>
        </div>

        <p className="relative mt-12 max-w-xl text-sm text-blue-100/80">
          Herramienta de apoyo a la decisión clínica en fase de investigación. No reemplaza el
          juicio clínico ni constituye una indicación diagnóstica o terapéutica.
        </p>
      </section>

      <section className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-16 lg:py-16">
        <div className="my-auto w-full max-w-sm py-12">
          <span className="mb-16 block text-3xl font-bold tracking-tight text-slate-900">MedIAssist</span>
          <h2 className="text-3xl font-bold text-slate-900">¡Bienvenido de vuelta!</h2>
          {/* Registro: pendiente de implementar */}
          <p className="mb-8 mt-2 text-sm text-slate-500">
            Iniciá sesión para usar los modelos. ¿No tenés usuario?{' '}
            <button type="button" className="font-medium text-slate-900 underline underline-offset-2">
              Creá una cuenta nueva
            </button>
            , es gratis.
          </p>
          <FormularioIngreso />
        </div>
      </section>
    </div>
  );
};

export default PaginaBienvenida;
