export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'w-full py-4 px-6 rounded-full font-bold text-[15px] transition active:scale-[0.97] disabled:opacity-40 tracking-tight';
  const variants = {
    primary:   'bg-black text-white hover:bg-gray-900',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50',
    outline:   'bg-white text-black border border-gray-200 hover:border-gray-400',
    ghost:     'bg-transparent text-black hover:bg-gray-50',
    danger:    'bg-black text-white hover:bg-gray-900',
    success:   'bg-black text-white hover:bg-gray-900',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
