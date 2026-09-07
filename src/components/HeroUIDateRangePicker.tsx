'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeroUIDateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  onChange: (range: { startDate: string; endDate: string }) => void;
  label?: string;
  isRequired?: boolean;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export function HeroUIDateRangePicker({
  startDate,
  endDate,
  onChange,
  label = 'Fechas del viaje',
  isRequired = true,
}: HeroUIDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view month from startDate or today
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  // Temp selection state during picking
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday ... convert to Monday = 0
    const day = new Date(year, month, 1).getDay();
    return (day + 6) % 7;
  };

  const toDateString = (year: number, month: number, day: number) => {
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate)) {
      // Start a new selection
      onChange({ startDate: dateStr, endDate: '' });
    } else if (startDate && !endDate) {
      if (dateStr < startDate) {
        // Clicked an earlier date, swap or set as start
        onChange({ startDate: dateStr, endDate: startDate });
      } else {
        onChange({ startDate, endDate: dateStr });
      }
      setIsOpen(false);
    }
  };

  const handleQuickPreset = (days: number) => {
    const parseLocal = (s: string) => {
      const parts = s.split('-').map(Number);
      return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0) : new Date();
    };
    const start = startDate ? parseLocal(startDate) : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));

    const formatDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const startStr = formatDateStr(start);
    const endStr = formatDateStr(end);
    onChange({ startDate: startStr, endDate: endStr });
    setIsOpen(false);
  };

  // Calculate day count
  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    const startParts = startDate.split('-').map(Number);
    const endParts = endDate.split('-').map(Number);
    if (startParts.length !== 3 || endParts.length !== 3) return null;
    const start = new Date(startParts[0], startParts[1] - 1, startParts[2], 12, 0, 0);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2], 12, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return null;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const daysCount = calculateDays();
  const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="relative w-full space-y-1.5" ref={containerRef}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
          {label} {isRequired && <span className="text-[#009688]">*</span>}
        </label>
        {daysCount && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00796b]">
            <Sparkles className="h-3 w-3" />
            {daysCount} {daysCount === 1 ? 'día' : 'días'}
          </span>
        )}
      </div>

      {/* HeroUI Pro DateRangePicker Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex h-12 w-full cursor-pointer items-center justify-between rounded-2xl border bg-zinc-50/70 px-3.5 text-sm transition-all duration-200 ${
          isOpen
            ? 'border-[#009688] bg-white ring-2 ring-[#009688]/15 shadow-sm'
            : 'border-zinc-200/90 hover:border-zinc-300 hover:bg-white'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
              isOpen || (startDate && endDate)
                ? 'bg-teal-50 text-[#009688]'
                : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-700'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold">
            {startDate ? (
              <span className="text-zinc-900">{formatDateDisplay(startDate)}</span>
            ) : (
              <span className="text-zinc-400 font-normal">Inicio (dd/mm/aaaa)</span>
            )}

            <span className="text-zinc-400 font-bold">—</span>

            {endDate ? (
              <span className="text-zinc-900">{formatDateDisplay(endDate)}</span>
            ) : (
              <span className="text-zinc-400 font-normal">Fin (dd/mm/aaaa)</span>
            )}
          </div>
        </div>

        {startDate && endDate && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ startDate: '', endDate: '' });
            }}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
            title="Limpiar fechas"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* HeroUI Pro Range Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-md rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 sm:w-[380px]">
          {/* Quick Presets */}
          <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-zinc-100 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duración:
            </span>
            {[
              { label: '3 días', days: 3 },
              { label: '1 semana', days: 7 },
              { label: '2 semanas', days: 14 },
              { label: '3 semanas', days: 21 },
            ].map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => handleQuickPreset(preset.days)}
                className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:border-[#009688] hover:bg-teal-50 hover:text-[#00796b]"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Month Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-sm font-extrabold text-zinc-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days Header */}
          <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold text-zinc-400 uppercase">
            {DAY_NAMES.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-9" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = toDateString(currentYear, currentMonth, dayNum);

              const isStart = startDate === dateStr;
              const isEnd = endDate === dateStr;
              const isInRange =
                startDate &&
                endDate &&
                dateStr > startDate &&
                dateStr < endDate;

              const isHoveredRange =
                startDate &&
                !endDate &&
                hoverDate &&
                hoverDate > startDate &&
                dateStr > startDate &&
                dateStr <= hoverDate;

              return (
                <div
                  key={dateStr}
                  className={`relative flex h-9 items-center justify-center ${
                    isInRange || isHoveredRange ? 'bg-teal-50/80' : ''
                  } ${isStart && endDate ? 'rounded-l-full bg-teal-50/80' : ''} ${
                    isEnd && startDate ? 'rounded-r-full bg-teal-50/80' : ''
                  }`}
                  onMouseEnter={() => setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isStart || isEnd
                        ? 'bg-[#009688] text-white shadow-md shadow-teal-500/30 scale-105'
                        : isInRange || isHoveredRange
                        ? 'text-[#00796b] font-extrabold hover:bg-[#009688]/20'
                        : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                    }`}
                  >
                    {dayNum}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
            <span>
              {startDate && !endDate
                ? 'Selecciona la fecha de fin'
                : startDate && endDate
                ? `${daysCount} días seleccionados`
                : 'Selecciona la fecha de inicio'}
            </span>
            {startDate && endDate && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="font-bold text-[#009688] hover:underline"
              >
                Confirmar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
