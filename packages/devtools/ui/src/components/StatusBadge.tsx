import React from 'react';

type Variant = 'success' | 'error' | 'warning' | 'info' | 'muted';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  pulse?: boolean;
}

const variantClasses: Record<Variant, string> = {
  success: 'bg-dt-success/10 text-dt-success border-dt-success/20',
  error: 'bg-dt-error/10 text-dt-error border-dt-error/20',
  warning: 'bg-dt-warning/10 text-dt-warning border-dt-warning/20',
  info: 'bg-dt-info/10 text-dt-info border-dt-info/20',
  muted: 'bg-dt-secondary text-dt-muted border-dt-border',
};

const dotColors: Record<Variant, string> = {
  success: 'bg-dt-success',
  error: 'bg-dt-error',
  warning: 'bg-dt-warning',
  info: 'bg-dt-info',
  muted: 'bg-dt-muted',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'muted',
  pulse = false,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${variantClasses[variant]}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColors[variant]}`}
          />
        )}
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColors[variant]}`}
        />
      </span>
      {label}
    </span>
  );
};

interface MethodBadgeProps {
  method: string;
}

const methodClasses: Record<string, string> = {
  GET: 'bg-method-get/15 text-method-get border-method-get/20',
  POST: 'bg-method-post/15 text-method-post border-method-post/20',
  PUT: 'bg-method-put/15 text-method-put border-method-put/20',
  PATCH: 'bg-method-patch/15 text-method-patch border-method-patch/20',
  DELETE: 'bg-method-delete/15 text-method-delete border-method-delete/20',
};

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const upper = method.toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
        methodClasses[upper] || 'bg-dt-secondary text-dt-muted border-dt-border'
      }`}
    >
      {upper}
    </span>
  );
};
