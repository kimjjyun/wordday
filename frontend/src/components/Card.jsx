export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white border border-gray-100 rounded-[28px] p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
