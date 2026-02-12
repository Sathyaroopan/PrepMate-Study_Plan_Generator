"use client";

import { useState, useEffect, useRef } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiCheck } from "react-icons/fi";

export default function DateTimePicker({ value, onChange, label }) {
    const [mode, setMode] = useState(null); // 'date' | 'time' | null
    const [viewDate, setViewDate] = useState(new Date()); // For calendar navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const popupRef = useRef(null);

    // Sync internal state with prop
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setViewDate(date);
            }
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setMode(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const generateDays = () => {
        const days = [];
        const daysInMonth = getDaysInMonth(viewDate);
        const firstDay = getFirstDayOfMonth(viewDate);

        // Fillers
        for (let i = 0; i < firstDay; i++) days.push(null);

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
        }

        return days;
    };

    const handleDateClick = (date) => {
        if (!date) return;

        const newDate = new Date(selectedDate);
        newDate.setFullYear(date.getFullYear());
        newDate.setMonth(date.getMonth());
        newDate.setDate(date.getDate());

        setSelectedDate(newDate);
        onChange(newDate.toISOString());
        setMode(null); // Close after date select
    };

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const handleTimeChange = (type, val) => {
        const newDate = new Date(selectedDate);
        if (type === 'hour') newDate.setHours(val);
        if (type === 'minute') newDate.setMinutes(val);

        setSelectedDate(newDate);
        onChange(newDate.toISOString());
    };

    const formatDisplayTime = (date) => {
        if (!date || isNaN(date.getTime())) return "--:--";
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
        <div className="relative w-full" ref={popupRef}>
            {label && <label className="block text-xs font-bold opacity-70 mb-1.5">{label}</label>}

            {/* Trigger Container */}
            <div className="flex w-full gap-2">

                {/* Date Trigger */}
                <div
                    onClick={() => setMode(mode === 'date' ? null : 'date')}
                    className={`flex-1 bg-[var(--s-btn)] border border-[var(--border)] rounded-lg flex items-center justify-between px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors ${mode === 'date' ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
                >
                    <div className="flex items-center gap-2">
                        <span className="font-mono bg-blue-500/10 text-blue-400 px-1.5 rounded text-xs py-0.5">
                            {selectedDate.getDate().toString().padStart(2, '0')}
                        </span>
                        <span className="opacity-30">-</span>
                        <span className="font-mono text-sm font-bold truncate">
                            {selectedDate.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span className="opacity-30">-</span>
                        <span className="opacity-50 text-xs">
                            {selectedDate.getFullYear()}
                        </span>
                    </div>
                    <FiCalendar className="opacity-40 text-sm" />
                </div>

                {/* Time Trigger */}
                <div
                    onClick={() => setMode(mode === 'time' ? null : 'time')}
                    className={`w-[120px] bg-[var(--s-btn)] border border-[var(--border)] rounded-lg flex items-center justify-between px-3 py-3 cursor-pointer hover:border-blue-500/50 transition-colors ${mode === 'time' ? 'border-blue-500 ring-1 ring-blue-500/20' : ''}`}
                >
                    <span className="font-mono text-sm font-bold opacity-90">
                        {formatDisplayTime(selectedDate)}
                    </span>
                    <FiClock className={`text-sm ${mode === 'time' ? 'text-blue-400 opacity-100' : 'opacity-40'}`} />
                </div>
            </div>

            {/* Popovers */}

            {/* Date Popover */}
            {mode === 'date' && (
                <div className="absolute top-full left-0 z-50 mt-2 w-[280px] bg-[#0f1115] border border-[var(--border)] rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-[var(--s-btn)] rounded-lg transition-colors"><FiChevronLeft size={16} /></button>
                        <div className="text-sm font-bold tracking-wide">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-[var(--s-btn)] rounded-lg transition-colors"><FiChevronRight size={16} /></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[10px] opacity-40 font-bold uppercase">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {generateDays().map((date, i) => {
                            if (!date) return <div key={i} />;
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <button key={i} type="button" onClick={() => handleDateClick(date)}
                                    className={`h-8 w-8 text-xs rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30' :
                                        isToday ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                            'hover:bg-[var(--s-btn)] text-[var(--text)]/70 hover:text-white'
                                        }`}
                                >{date.getDate()}</button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Time Popover */}
            {mode === 'time' && (
                <div className="absolute top-full right-0 z-50 mt-2 w-[160px] bg-[#0f1115] border border-[var(--border)] rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-wider mb-2 flex items-center gap-1 justify-center">
                        <FiClock size={10} /> Select Time
                    </div>
                    <div className="flex gap-1 h-[200px]">
                        <div className="flex-1 overflow-y-auto scrollbar-hide bg-[var(--s-btn)]/30 rounded-lg">
                            {hours.map(h => (
                                <button key={h} type="button" onClick={() => handleTimeChange('hour', h)}
                                    className={`w-full py-1.5 text-[10px] font-mono hover:bg-white/10 ${selectedDate.getHours() === h ? 'bg-blue-600 text-white font-bold' : 'opacity-60'}`}
                                >{h.toString().padStart(2, '0')}</button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-hide bg-[var(--s-btn)]/30 rounded-lg">
                            {minutes.map(m => (
                                <button key={m} type="button" onClick={() => handleTimeChange('minute', m)}
                                    className={`w-full py-1.5 text-[10px] font-mono hover:bg-white/10 ${(Math.abs(selectedDate.getMinutes() - m) < 5 && Math.floor(selectedDate.getMinutes() / 5) * 5 === m) ? 'bg-blue-600 text-white font-bold' : 'opacity-60'
                                        }`}
                                >{m.toString().padStart(2, '0')}</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setMode(null)} className="mt-2 w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider transition-colors">Done</button>
                </div>
            )}
        </div>
    );
}
