'use client';

import React, { useState } from 'react';
import { AVATAR_PRESETS, AvatarPreset, getAvatarSvgDataUrl, getAvatarById } from '@/lib/avatars';
import { X, Check, Upload, Trash2, Sparkles, User, Image as ImageIcon } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName?: string;
  onSelectAvatar: (avatarValue: string) => void;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  userName = 'Alvaro',
  onSelectAvatar,
}: AvatarPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string>(currentAvatar || 'traveler-girl-teal');
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'upload'>('presets');
  const [customImageUrl, setCustomImageUrl] = useState<string>(
    currentAvatar?.startsWith('http') || currentAvatar?.startsWith('data:') ? currentAvatar : ''
  );
  const [selectedColor, setSelectedColor] = useState<string>('#009688');
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedId(preset.id);
    onSelectAvatar(preset.id);
    onClose();
  };

  const handleSaveCustomImage = () => {
    if (customImageUrl.trim()) {
      onSelectAvatar(customImageUrl.trim());
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('La imagen no debe superar los 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const dataUrl = reader.result as string;
          setCustomImageUrl(dataUrl);
          onSelectAvatar(dataUrl);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    onSelectAvatar('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl animate-scale-in z-10 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0f2f1] text-[#009688]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828]">Elige tu foto de perfil</h3>
              <p className="text-xs text-[#667085]">Selecciona un avatar ilustrado o sube una imagen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-full bg-[#f4f4f5] p-1 border border-zinc-200/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 rounded-full py-1.5 transition cursor-pointer ${
              activeTab === 'presets' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Avatares Ilustrados
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 rounded-full py-1.5 transition cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Subir Foto
          </button>
        </div>

        {/* Tab 1: Presets Grid */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 sm:gap-4 max-h-[260px] overflow-y-auto p-1 [scrollbar-width:thin]">
              {AVATAR_PRESETS.map((p) => {
                const isSelected = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-3 ring-[#009688] bg-[#e0f2f1]/40 scale-105 shadow-sm'
                        : 'hover:bg-zinc-100/80 hover:scale-102'
                    }`}
                  >
                    <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-full overflow-hidden shadow-xs border border-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getAvatarSvgDataUrl(p.svg)}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#009688]/30 flex items-center justify-center">
                          <div className="rounded-full bg-[#009688] p-1 text-white shadow-xs">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 truncate max-w-full text-center">
                      {p.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Upload / URL */}
        {activeTab === 'upload' && (
          <div className="space-y-4 py-2">
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-center hover:border-[#009688] hover:bg-[#e0f2f1]/20 transition cursor-pointer">
              <Upload className="h-8 w-8 text-[#009688] mb-2" />
              <span className="text-xs font-bold text-zinc-800">Haz clic para subir una foto</span>
              <span className="text-[11px] text-zinc-500 mt-0.5">PNG, JPG o WEBP (máx. 2MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploadError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                {uploadError}
              </p>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-zinc-400 font-medium uppercase absolute">o pega enlace</span>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:outline-hidden focus:border-[#009688] focus:ring-1 focus:ring-[#009688]"
              />
              <button
                type="button"
                onClick={handleSaveCustomImage}
                disabled={!customImageUrl.trim()}
                className="rounded-xl bg-[#009688] px-4 py-2 text-xs font-bold text-white hover:bg-[#00796b] disabled:opacity-50 transition cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar foto</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Circular Avatar Viewer Component
export function UserAvatarDisplay({
  avatar,
  name,
  size = 'md',
  className = '',
}: {
  avatar?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 sm:h-28 sm:w-28 text-2xl',
  };

  const preset = getAvatarById(avatar);

  if (preset) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden shadow-xs border border-black/5 ${sizeClasses[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAvatarSvgDataUrl(preset.svg)}
          alt={preset.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  if (avatar && (avatar.startsWith('http') || avatar.startsWith('data:'))) {
    return (
      <div
        className={`relative shrink-0 rounded-full overflow-hidden shadow-xs border border-black/5 ${sizeClasses[size]} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt={name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Default Initials Avatar
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#009688] font-black text-white shadow-xs ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
