import React from 'react';

interface StatusBadgeProps {
  status?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'md',
  children,
}) => {
  const label = (status ?? children ?? 'Pending')
    .toString()
    .trim() || 'Pending';

  const badgeVariant = variant ?? (() => {
    const normalized = label.toLowerCase();

    if (['verified', 'approved', 'match', 'valid_trusted_issuer', 'success'].includes(normalized)) {
      return 'success';
    }

    if (['tampered', 'rejected', 'mismatch', 'invalid_signature', 'failed', 'error', 'reference_unavailable', 'document_unavailable', 'inactive_reference', 'no_trusted_reference', 'invalid_reference'].includes(normalized)) {
      return 'error';
    }

    if (['pending', 'unknown issuer', 'warning', 'untrusted_issuer', 'validation_unavailable', 'no_signature', 'not_implemented', 'reference_error', 'in_progress', 'processing'].includes(normalized)) {
      return 'warning';
    }

    if (normalized === 'processed') {
      return 'info';
    }

    return 'default';
  })();

  const variantClasses: Record<NonNullable<StatusBadgeProps['variant']>, string> = {
    success: 'text-green-800 bg-green-100',
    error: 'text-red-800 bg-red-100',
    warning: 'text-orange-800 bg-orange-100',
    info: 'text-blue-800 bg-blue-100',
    default: 'text-gray-800 bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses[size]} ${variantClasses[badgeVariant]}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
