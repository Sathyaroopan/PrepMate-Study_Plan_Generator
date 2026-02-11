"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Settings2, Plus, X, Save } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const DEFAULT_SLOTS = [
  { id: 1, startTime: "09:00", endTime: "10:00", isBreak: false },
  { id: 2, startTime: "10:00", endTime: "11:00", isBreak: false },
  { id: 3, startTime: "11:00", endTime: "11:15", isBreak: true },
  { id: 4, startTime: "11:15", endTime: "12:15", isBreak: false },
  { id: 5, startTime: "12:15", endTime: "13:00", isBreak: true },
  { id: 6, startTime: "13:00", endTime: "14:00", isBreak: false },
  { id: 7, startTime: "14:00", endTime: "15:00", isBreak: false },
];

export default function TimetableEditor() {
  const [timetable, setTimetable] = useState({});
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showSlotManager, setShowSlotManager] = useState(false);
  const [tempSlots, setTempSlots] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'save' | 'cancel'
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "", isBreak: false });
  const [saving, setSaving] = useState(false);

  const endTimeRef = useRef(null);

  const hasChanges = JSON.stringify(slots) !== JSON.stringify(tempSlots);

  // Load Data
  useEffect(() => {
    const init = async () => {
      try {
        const [profileRes, timetableRes] = await Promise.all([
          fetch("/api/auth/profile", { credentials: "include" }),
          fetch("/api/auth/timetable", { credentials: "include" })
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setAvailableCourses(profileData.courses || []);
        }
        if (timetableRes.ok) {
          const timetableData = await timetableRes.json();
          if (timetableData.slots) setSlots(timetableData.slots);
          if (timetableData.timetable) setTimetable(timetableData.timetable);
        }
      } catch (err) {
        console.error("Initialization error", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    init();
  }, []);

  const handleChange = (day, slotId, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: { ...prev[day], [slotId]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slots, timetable }),
      });
      if (res.ok) alert("Schedule updated successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSlotManager = () => {
    if (showSlotManager) {
      if (showConfirmModal) setShowConfirmModal(false);
      setShowSlotManager(false);
    } else {
      setTempSlots([...slots]);
      setShowSlotManager(true);
    }
  };

  const initiateSave = () => {
    setModalAction('save');
    setShowConfirmModal(true);
  };

  const initiateCancel = () => {
    setModalAction('cancel');
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (modalAction === 'save') {
      setSlots(tempSlots);
      setShowSlotManager(false);
    } else if (modalAction === 'cancel') {
      setShowSlotManager(false);
    }
    setShowConfirmModal(false);
  };

  const addSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) return;
    const nextId = Math.max(...tempSlots.map((s) => s.id), 0) + 1;
    const updatedSlots = [...tempSlots, { id: nextId, ...newSlot }].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    setTempSlots(updatedSlots);
    setNewSlot({ startTime: "", endTime: "", isBreak: false });
  };

  const removeSlot = (slotId) => {
    setTempSlots(tempSlots.filter((s) => s.id !== slotId));
  };

  if (loadingCourses) return (
    <div className="flex items-center justify-center min-h-screen text-text opacity-50 font-medium">
      Loading your workspace...
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-bg text-text min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border)] pb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Weekly Schedule</h1>
            <div className="flex items-center gap-2 text-sm text-primary-btn font-semibold">
              <Sparkles size={14} />
              <span>AutoPilot Enabled</span>
            </div>
          </div>
          <button
            onClick={toggleSlotManager}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-btn text-secondary-btn-text hover:bg-secondary-btn-hover transition-all text-sm font-medium border border-[var(--border)]"
          >
            <Settings2 size={16} />
            {showSlotManager ? "Hide Settings" : "Configure Slots"}
          </button>
        </header>

        {/* Slot Config Panel */}
        {showSlotManager && (
          <section className="p-6 border border-[var(--border)] rounded-2xl bg-secondary-btn/10 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold mb-4 text-lg flex items-center gap-2">
              <Settings2 size={18} /> Time Slot Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {tempSlots.map((slot) => (
                <div key={slot.id} className="flex items-center gap-2 p-3 bg-bg border border-[var(--border)] rounded-xl shadow-sm group">
                  <div className="text-xs font-mono font-bold opacity-40">{slot.startTime}</div>
                  <div className="h-px w-2 bg-[var(--border)]"></div>
                  <div className="text-xs font-mono font-bold opacity-40">{slot.endTime}</div>
                  <button onClick={() => removeSlot(slot.id)} className="ml-auto text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 bg-bg border border-[var(--border)] px-4 py-2 rounded-xl">
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={e => {
                    setNewSlot({ ...newSlot, startTime: e.target.value });
                    if (e.target.value && endTimeRef.current) {
                      endTimeRef.current.focus();
                    }
                  }}
                  className="bg-transparent outline-none text-sm cursor-pointer"
                />
                <span className="opacity-20">—</span>
                <input
                  ref={endTimeRef}
                  type="time"
                  value={newSlot.endTime}
                  onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  className="bg-transparent outline-none text-sm cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={newSlot.isBreak} onChange={e => setNewSlot({ ...newSlot, isBreak: e.target.checked })} className="w-4 h-4 rounded border-[var(--border)] accent-primary-btn" />
                <span className="text-sm font-medium opacity-70 group-hover:opacity-100 transition-opacity">Break</span>
              </label>
              <button onClick={addSlot} className="px-5 py-2 bg-primary-btn text-primary-btn-text rounded-xl text-sm font-bold hover:bg-primary-btn-hover flex items-center gap-2 transition-all">
                <Plus size={16} /> Add Slot
              </button>

              <div className="ml-auto flex items-center gap-3">
                {hasChanges && (
                  <>
                    <button onClick={initiateCancel} className="px-5 py-2 rounded-xl text-sm font-medium hover:bg-red-50 text-red-500 transition-colors animate-in fade-in zoom-in-95 duration-200">
                      Cancel
                    </button>
                    <button onClick={initiateSave} className="px-5 py-2 bg-primary-btn text-primary-btn-text rounded-xl text-sm font-bold hover:bg-primary-btn-hover shadow-lg shadow-primary-btn/20 transition-all flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <Save size={16} /> Save Slots
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-bg border border-[var(--border)] p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold">{modalAction === 'save' ? "Save Changes?" : "Discard Changes?"}</h4>
                    <p className="text-sm opacity-70">
                      {modalAction === 'save'
                        ? "This will update your main schedule grid with the new time slots. You still need to click \"Save Changes\" at the bottom to persist to the database."
                        : "Are you sure you want to discard your changes? All unsaved slot configurations will be lost."}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-secondary-btn text-secondary-btn-text hover:bg-secondary-btn-hover transition-colors"
                    >
                      Keep Editing
                    </button>
                    <button
                      onClick={handleConfirm}
                      className={`flex-1 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors ${modalAction === 'save'
                        ? "bg-primary-btn text-primary-btn-text hover:bg-primary-btn-hover shadow-primary-btn/20"
                        : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                        }`}
                    >
                      {modalAction === 'save' ? "Confirm" : "Discard"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main Grid Container */}
        <div className="rounded-2xl border border-[var(--border)] bg-bg shadow-2xl shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            {/* Table min-width ensures it doesn't collapse below readable size */}
            <table className="w-full border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-secondary-btn/30">
                  <th className="p-5 text-left text-xs font-black uppercase tracking-widest opacity-40 border-b border-r border-[var(--border)] w-32">Timeline</th>
                  {slots.map((slot) => (
                    <th key={slot.id} className={`p-5 border-b border-r border-[var(--border)] ${slot.isBreak ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                      <div className="text-sm font-black tracking-tighter">{slot.startTime} — {slot.endTime}</div>
                      {slot.isBreak && <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">Interval</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day} className="group hover:bg-secondary-btn/5 transition-colors">
                    <td className="p-5 font-bold border-r border-b border-[var(--border)] bg-secondary-btn/10 group-hover:bg-secondary-btn/20 transition-colors">
                      {day}
                    </td>
                    {slots.map((slot) => (
                      <td key={slot.id} className={`p-2 border-r border-b border-[var(--border)] transition-colors ${slot.isBreak ? 'bg-amber-50/10 dark:bg-amber-900/5' : ''}`}>
                        {slot.isBreak ? (
                          <div className="flex justify-center py-4">
                            <div className="h-1 w-6 bg-amber-200 dark:bg-amber-800/40 rounded-full"></div>
                          </div>
                        ) : (
                          <select
                            value={timetable[day]?.[slot.id] || ""}
                            onChange={(e) => handleChange(day, slot.id, e.target.value)}
                            className="w-full bg-transparent border border-transparent hover:border-[var(--border)] rounded-lg px-3 py-3 text-sm focus:bg-secondary-btn/20 focus:ring-0 outline-none transition-all cursor-pointer appearance-none font-medium"
                          >
                            <option value="">—</option>
                            {availableCourses.map((course, i) => (
                              <option key={i} value={course}>{course}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Footer */}
        <footer className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="group flex items-center gap-3 px-10 py-4 rounded-2xl font-bold bg-primary-btn text-primary-btn-text hover:bg-primary-btn-hover shadow-xl shadow-primary-btn/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
          >
            <Save size={18} className="group-hover:scale-110 transition-transform" />
            {saving ? "Deploying Schedule..." : "Save Changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
