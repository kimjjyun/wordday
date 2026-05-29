export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'w-full py-3 px-4 rounded-xl font-semibold text-base transition active:scale-95 disabled:opacity-50';
  const variants = {
    primary:   'bg-indigo-500 hover:bg-indigo-600 text-white',
    success:   'bg-emerald-500 hover:bg-emerald-600 text-white',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    outline:   'border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
