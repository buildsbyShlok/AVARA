export default function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-pulse bg-sand-300/60';
  const variants = {
    rect: 'rounded-2xl',
    circle: 'rounded-full',
    text: 'rounded-lg h-4',
  };
  return <div className={`${base} ${variants[variant]} ${className}`} />;
}
