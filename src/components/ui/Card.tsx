interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`bg-navy-light/60 backdrop-blur-sm border border-purple/20 rounded-2xl p-6 ${onClick ? "cursor-pointer hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5 transition-all duration-200" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
