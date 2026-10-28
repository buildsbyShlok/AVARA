export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  border = true
}) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-3xl'
  };

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  const avatarUrl = typeof src === 'object' ? src?.url : src;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-sand-200 select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${border ? 'border-2 border-white shadow-sm' : ''} ${className}`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span className="font-serif font-bold text-obsidian-700">{initial}</span>
      )}
    </div>
  );
}
