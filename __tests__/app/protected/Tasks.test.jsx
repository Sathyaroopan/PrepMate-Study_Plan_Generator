import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TasksPage from "@/app/(protected)/tasks/page";

// Mock fetch
global.fetch = jest.fn();

describe("TasksPage", () => {
    const mockTasks = [
        {
            _id: "1",
            title: "Task 1",
            courseId: { name: "Math" },
            deadline: "2026-02-20T10:00:00.000Z",
            estimatedHours: 2,
            priority: "high",
        },
    ];

    const mockProfile = {
        courses: ["Math", "Science"],
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading state initially", () => {
        fetch.mockImplementation(() => new Promise(() => { })); // Never resolves
        render(<TasksPage />);
        expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
    });

    it("renders empty state", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/tasks") {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        render(<TasksPage />);

        await waitFor(() => {
            expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
        });
    });

    it("renders task list", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/tasks") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockTasks,
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        render(<TasksPage />);

        await waitFor(() => {
            expect(screen.getByText("Task 1")).toBeInTheDocument();
            expect(screen.getByText("Math")).toBeInTheDocument();
        });
    });

    it("opens modal and adds a new task", async () => {
        fetch.mockImplementation((url, options) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/tasks" && (!options || options.method !== "POST")) {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            if (url === "/api/tasks" && options.method === "POST") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ message: "Task created" }),
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        // Mock alert
        window.alert = jest.fn();

        render(<TasksPage />);

        // Wait for initial load
        await waitFor(() => screen.getByText(/all caught up/i));

        // Open Modal
        fireEvent.click(screen.getByText(/\+ add new task/i));
        expect(screen.getByText("Create Task")).toBeInTheDocument();

        // Fill Form
        // Using placeholders and roles as labels are not associated
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "Math" } });
        fireEvent.change(screen.getByPlaceholderText(/e.g., Midterm Exam Prep/i), { target: { value: "New Task" } });

        // For DateTimePicker custom component
        // 1. Open Date Popover
        const dateTrigger = screen.getByText(new Date().getFullYear().toString());
        fireEvent.click(dateTrigger);
        // 2. Click a date (e.g., 15)
        const dateButton = screen.getByText("15");
        fireEvent.click(dateButton);

        fireEvent.change(screen.getByPlaceholderText(/2.5/i), { target: { value: "3" } });

        // Submit
        fireEvent.click(screen.getByRole("button", { name: /add task/i }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/tasks",
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining("New Task"),
                })
            );
        });

        // Modal should close
        await waitFor(() => {
            expect(screen.queryByText("Create Task")).not.toBeInTheDocument();
        });
    });

    it("validates form inputs", async () => {
        fetch.mockImplementation((url) => {
            if (url === "/api/auth/profile") {
                return Promise.resolve({
                    ok: true,
                    json: async () => mockProfile,
                });
            }
            if (url === "/api/tasks") {
                return Promise.resolve({
                    ok: true,
                    json: async () => [],
                });
            }
            return Promise.reject(new Error("Unknown URL"));
        });

        // Mock alert
        jest.spyOn(window, 'alert').mockImplementation(() => { });

        render(<TasksPage />);
        await waitFor(() => screen.getByText(/\+ add new task/i));

        fireEvent.click(screen.getByText(/\+ add new task/i));

        // Attempt submit empty
        fireEvent.click(screen.getByRole("button", { name: /add task/i }));

        expect(window.alert).toHaveBeenCalledWith("Please fill all required fields");
    });
});
