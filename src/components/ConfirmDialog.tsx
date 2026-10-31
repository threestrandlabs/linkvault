import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmTestId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel,
  confirmTestId,
  onConfirm,
  onCancel,
}) => {
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center sm:items-center p-0 sm:p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-sm bg-[var(--sheet)] border-t sm:border border-[var(--line)] p-5 pb-9 sm:pb-5 flex flex-col gap-2 self-end sm:self-center"
      >
        <span className="font-semibold text-lg">{title}</span>
        <span className="text-xs leading-relaxed text-[var(--muted)]">{message}</span>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={onCancel}
            className="h-11 border border-[var(--line)] bg-transparent text-[var(--text)] text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            data-testid={confirmTestId}
            className="blueprint h-11 bg-[var(--btn)] text-white border-0 text-sm font-semibold cursor-pointer"
          >
            <i className="corner tl"></i>
            <i className="corner tr"></i>
            <i className="corner bl"></i>
            <i className="corner br"></i>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
