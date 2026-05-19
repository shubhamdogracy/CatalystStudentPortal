export default function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
  return <span className={`card-title ${className}`}>{children}</span>;
}
