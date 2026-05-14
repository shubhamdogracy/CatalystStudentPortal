const VARIANT = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  danger:  'btn-danger',
  success: 'btn-success',
};

export default function Button({
  variant = 'primary',
  size,
  loading = false,
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      className={`btn ${VARIANT[variant] ?? VARIANT.primary} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
