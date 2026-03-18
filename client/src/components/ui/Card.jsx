export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-[#1C1C1E] rounded-xl p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
