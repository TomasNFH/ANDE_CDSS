import { useId } from 'react';

// Logo de MedIAssist dibujado en SVG: cruz médica con circuito y globo de diálogo.
// No tiene fondo: la cruz se recorta con una máscara donde se superponen el globo y los círculos.
type LogoProps = {
  className?: string;
  color?: string;
};

const GLOBO = 'M10 90L11.2 80.5A13 13 0 1 1 17.5 86.8z';
const CIRCULOS = [
  [69, 9.5],
  [85, 11],
  [88, 28],
];

const Logo = ({ className, color = '#2563EB' }: LogoProps) => {
  const mascara = useId();

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" role="img" aria-label="MedIAssist">
      <mask id={mascara} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect width="100" height="100" fill="white" />
        <path d={GLOBO} fill="black" stroke="black" strokeWidth="7" strokeLinejoin="round" />
        {CIRCULOS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="6" fill="black" />
        ))}
      </mask>
      <g stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <g mask={`url(#${mascara})`}>
          {/* Cruz */}
          <path d="M41 11h17a4 4 0 0 1 4 4v19a2 2 0 0 0 2 2h20a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H64a2 2 0 0 0-2 2v20a4 4 0 0 1-4 4H41a4 4 0 0 1-4-4V64a2 2 0 0 0-2-2H15a4 4 0 0 1-4-4V40a4 4 0 0 1 4-4h20a2 2 0 0 0 2-2V15a4 4 0 0 1 4-4z" />
          {/* Circuito */}
          <path d="M62 28l7-8V13" />
          <path d="M62 33l20-19" />
          <path d="M66 36l8-8h10" />
        </g>
        {/* Globo de diálogo */}
        <path d={GLOBO} />
      </g>
      <g stroke={color} strokeWidth="3.4">
        {CIRCULOS.map(([cx, cy]) => (
          <circle key={cx} cx={cx} cy={cy} r="3.5" />
        ))}
      </g>
    </svg>
  );
};

export default Logo;
