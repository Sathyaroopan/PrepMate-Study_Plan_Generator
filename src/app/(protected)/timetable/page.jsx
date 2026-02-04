"use client";
import { useState, useEffect } from "react";

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

  // New slot form
  const [newSlot, setNewSlot] = useState({ startTime: "", endTime: "", isBreak: false });

  // Load user's courses from profile
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setAvailableCourses(data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses", err);
      } finally {
        setLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadTimetable = async () => {
      try {
        const res = await fetch("/api/auth/timetable", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || DEFAULT_SLOTS);
          setTimetable(data.timetable || {});
        }
      } catch (err) {
        console.error("Failed to load timetable", err);
      }
    };

    loadTimetable();
  }, []);

  const handleChange = (day, slotId, value) => {
    setTimetable((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotId]: value,
      },
    }));
  };

  const handleSave = async () => {
    await fetch("/api/auth/timetable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ slots, timetable }),
    });

    alert("Timetable saved");
  };

  const addSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert("Please enter start and end times");
      return;
    }

    const nextId = Math.max(...slots.map(s => s.id), 0) + 1;
    const updatedSlots = [...slots, { id: nextId, ...newSlot }];

    // Sort by start time
    updatedSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setSlots(updatedSlots);
    setNewSlot({ startTime: "", endTime: "", isBreak: false });
  };

  const removeSlot = (slotId) => {
    setSlots(slots.filter(s => s.id !== slotId));

    // Also remove timetable entries for this slot
    const updatedTimetable = { ...timetable };
    days.forEach(day => {
      if (updatedTimetable[day]) {
        delete updatedTimetable[day][slotId];
      }
    });
    setTimetable(updatedTimetable);
  };

  const toggleBreak = (slotId) => {
    setSlots(slots.map(s =>
      s.id === slotId ? { ...s, isBreak: !s.isBreak } : s
    ));

    // Clear timetable entries for break slots
    const slot = slots.find(s => s.id === slotId);
    if (!slot.isBreak) { // Will become a break
      const updatedTimetable = { ...timetable };
      days.forEach(day => {
        if (updatedTimetable[day]) {
          delete updatedTimetable[day][slotId];
        }
      });
      setTimetable(updatedTimetable);
    }
  };

  const updateSlotTime = (slotId, field, value) => {
    setSlots(slots.map(s =>
      s.id === slotId ? { ...s, [field]: value } : s
    ));
  };

  const formatSlotLabel = (slot) => {
    return `${slot.startTime}–${slot.endTime}`;
  };

  if (loadingCourses) {
    return <div className="p-6">Loading subjects...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Weekly Timetable</h2>
        <button
          onClick={() => setShowSlotManager(!showSlotManager)}
          className="px-3 py-1.5 rounded text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ⚙️ {showSlotManager ? "Hide Slot Settings" : "Manage Time Slots"}
        </button>
      </div>

      {/* Slot Manager Panel */}
      {showSlotManager && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3">Time Slots Configuration</h3>

          {/* Existing Slots */}
          <div className="space-y-2 mb-4">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded border">
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlotTime(slot.id, "startTime", e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-transparent"
                />
                <span>to</span>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlotTime(slot.id, "endTime", e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-transparent"
                />
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={slot.isBreak}
                    onChange={() => toggleBreak(slot.id)}
                    className="w-4 h-4"
                  />
                  Break
                </label>
                <button
                  onClick={() => removeSlot(slot.id)}
                  className="ml-auto text-red-500 hover:text-red-700 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add New Slot */}
          <div className="flex items-center gap-3 p-2 border-t pt-4">
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              placeholder="Start"
              className="border rounded px-2 py-1 text-sm bg-transparent"
            />
            <span>to</span>
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              placeholder="End"
              className="border rounded px-2 py-1 text-sm bg-transparent"
            />
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={newSlot.isBreak}
                onChange={(e) => setNewSlot({ ...newSlot, isBreak: e.target.checked })}
                className="w-4 h-4"
              />
              Break
            </label>
            <button
              onClick={addSlot}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
              + Add Slot
            </button>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <table className="border-collapse border w-full text-center min-w-[800px]">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-100 dark:bg-gray-700">Day / Time</th>
              {slots.map((slot) => (
                <th
                  key={slot.id}
                  className={`border p-2 ${slot.isBreak ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}
                >
                  <div>{formatSlotLabel(slot)}</div>
                  {slot.isBreak && <div className="text-xs text-amber-600 dark:text-amber-400">Break</div>}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td className="border p-2 font-semibold bg-gray-50 dark:bg-gray-800">{day}</td>

                {slots.map((slot) => (
                  <td
                    key={slot.id}
                    className={`border p-2 ${slot.isBreak ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                  >
                    {slot.isBreak ? (
                      <span className="text-amber-600 dark:text-amber-400 text-sm italic">Break</span>
                    ) : (
                      <select
                        value={timetable[day]?.[slot.id] || ""}
                        onChange={(e) => handleChange(day, slot.id, e.target.value)}
                        className="w-full border rounded px-2 py-1
                                  bg-bg text-text
                                  dark:bg-bg dark:text-primary-btn-text dark:border-gray-600"
                      >
                        <option value="">-- Select --</option>
                        {availableCourses.map((course, i) => (
                          <option key={i} value={course}>
                            {course}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Saturday & Sunday */}
            <tr>
              <td className="border p-2 font-semibold bg-gray-50 dark:bg-gray-800">Saturday</td>
              <td colSpan={slots.length} className="border p-2 text-gray-500 italic">
                Holiday
              </td>
            </tr>
            <tr>
              <td className="border p-2 font-semibold bg-gray-50 dark:bg-gray-800">Sunday</td>
              <td colSpan={slots.length} className="border p-2 text-gray-500 italic">
                Holiday
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 px-4 py-2 rounded cursor-pointer bg-primary-btn text-primary-btn-text hover:bg-primary-btn-hover transition-colors"
      >
        Save Timetable
      </button>
    </div>
  );
}
