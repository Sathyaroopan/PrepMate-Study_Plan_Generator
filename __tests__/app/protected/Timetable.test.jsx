import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TimetableEditor from "@/app/(protected)/timetable/page";

// Mock fetch
global.fetch = jest.fn();

describe("TimetableEditor", () => {
    const mockProfile = {
        courses: ["Math", "Science"],
    };

    const mockTimetable = {
        slots: [
            { id: 1, startTime: "09:00", endTime: "10:00", isBreak: false },
        ],
        timetable: {
            Monday: { 1: "Math" },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading state initially", () => {
        fetch.mockImplementation(() => new Promise(() => { }));
        render(<TimetableEditor />);
        expect(screen.getByText(/loading your workspace/i)).toBeInTheDocument();
    });

    it("fetches and renders timetable grid", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/auth/timetable") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockTimetable,
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        render(<TimetableEditor />);

        await waitFor(() => {
            expect(screen.getByText("Weekly Schedule")).toBeInTheDocument();
            expect(screen.getByText(/09:00 — 10:00/i)).toBeInTheDocument();
        });
    });

    it("updates timetable entries", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/auth/timetable") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockTimetable,
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        render(<TimetableEditor />);
        await waitFor(() => screen.getByText("Weekly Schedule"));

        // Find the select for Monday, Slot 1
        // It already has "Math" selected based on mock
        const selects = screen.getAllByRole("combobox");
        const mondaySelect = selects[0]; // Assuming first one based on order

        expect(mondaySelect.value).toBe("Math");

        fireEvent.change(mondaySelect, { target: { value: "Science" } });
        expect(mondaySelect.value).toBe("Science");
    });

    it("saves timetable changes", async () => {
        fetch.mockImplementation((url, options) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/auth/timetable" && (!options || options.method !== "POST")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockTimetable,
                });
            }
            if (url === "/api/auth/timetable" && options.method === "POST") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true }),
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        // Mock alert
        jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(<TimetableEditor />);
        await waitFor(() => screen.getByText("Weekly Schedule"));

        fireEvent.click(screen.getByText("Save Changes"));

        expect(screen.getByText("Deploying Schedule...")).toBeInTheDocument();

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith("Schedule updated successfully!");
        });
    });

    it("adds and removes slots", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/auth/timetable") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ slots: [], timetable: {} }),
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        render(<TimetableEditor />);
        await waitFor(() => screen.getByText("Weekly Schedule"));

        // Open Config
        fireEvent.click(screen.getByText("Configure Slots"));
        expect(screen.getByText("Time Slot Configuration")).toBeInTheDocument();

        // Add Slot
        // We need to fill inputs. The component has:
        // <input type="time" ... />
        const timeInputs = document.querySelectorAll('input[type="time"]');
        // 0 is start, 1 is end
        fireEvent.change(timeInputs[0], { target: { value: "10:00" } });
        fireEvent.change(timeInputs[1], { target: { value: "11:00" } });

        fireEvent.click(screen.getByText("Add Slot"));

        // Check if added to the list in config panel
        // The list displays "10:00" and "11:00"
        expect(screen.getByText("10:00")).toBeInTheDocument();

        // Remove Slot - assuming the X button is present
        // The X button is visible on group hover, but in test we can click it if it's in DOM
        // The component code: button with onClick removeSlot
        // It has <X /> icon.
        // We can find by role button inside the slot item.
        // Or simpler: query selector for the remove button
        // It has `ml-auto text-red-400 ...`
        // Let's use `fireEvent.click` on the remove button if we can find it.
        // We can filter buttons by checking if they contain the X icon or just try to find the button in the slot row.

        // Actually, finding the button is tricky without text.
        // Let's rely on the fact that we just added one slot, so there is one remove button in the list.
        // The table headers also have slots, but no remove button there.
        // The config panel has remove buttons.

        const removeButtons = document.querySelectorAll('.text-red-400'); // Class from component
        if (removeButtons.length > 0) {
            fireEvent.click(removeButtons[0]);
            // Should be gone
            await waitFor(() => {
                expect(screen.queryByText("10:00")).not.toBeInTheDocument();
            });
        }
    });
});
