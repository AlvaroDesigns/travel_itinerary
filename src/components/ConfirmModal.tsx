'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'trash' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon = 'trash',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 className="h-6 w-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-600" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-rose-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-50 border border-rose-100';
      case 'warning':
        return 'bg-amber-50 border border-amber-100';
      case 'info':
        return 'bg-blue-50 border border-blue-100';
      default:
        return 'bg-rose-50 border border-rose-100';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500/20';
      case 'info':
        return 'bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-xs focus:ring-[#0066FF]/20';
      default:
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-scale-in z-10 space-y-5"
      >
        {/* Top Header with Icon & Close */}
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${getIconBg()}`}>
            {getIcon()}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-[#101828] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
