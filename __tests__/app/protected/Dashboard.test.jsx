import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "@/app/(protected)/dashboard/page";

// Mock fetch
global.fetch = jest.fn();

// Mock next/link
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// Mock StatCard component since it's just a UI component
jest.mock("@/app/(protected)/dashboard/page", () => {
    const originalModule = jest.requireActual("@/app/(protected)/dashboard/page");
    return {
        __esModule: true,
        ...originalModule,
        // If we needed to mock internal components we would export them separately, 
        // but since StatCard is internal to the file and not exported, 
        // we can test the whole page integration or we would need to refactor StatCard to its own file.
        // For now, we will test the page as is, including the internal components.
        default: originalModule.default,
    };
});

describe("DashboardPage", () => {
    const mockUser = { name: "Test User" };
    const mockTasks = [
        { id: 1, title: "Task 1", status: "pending", priority: "high", estimatedHours: 2, deadline: "2026-02-20" },
        { id: 2, title: "Task 2", status: "pending", priority: "medium", estimatedHours: 1, deadline: "2026-02-25" },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders loading state initially", () => {
        // Mock fetch to not resolve immediately to check loading state
        fetch.mockImplementation(() => new Promise(() => { }));

        render(<DashboardPage />);
        // Just check if it handles the loading state gracefully (which it does via the return null or loading spinner)
        // The current implementation returns a spinner
        const spinner = document.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
    });

    it("fetches data and renders user name and stats", async () => {
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockUser, // Profile response
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockTasks, // Tasks response
            });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/Test User/)).toBeInTheDocument();
        });

        // Check stats
        expect(screen.getByText("2")).toBeInTheDocument(); // Pending tasks
        expect(screen.getByText("1")).toBeInTheDocument(); // High Priority tasks (Task 1)
        expect(screen.getByText("3h")).toBeInTheDocument(); // Study Debt (2 + 1)
    });

    it("renders 'Student' if user name is missing", async () => {
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({}), // Empty profile
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [], // Empty tasks
            });

        render(<DashboardPage />);

        await waitFor(() => {
            expect(screen.getByText(/Student/)).toBeInTheDocument();
        });
    });

    it("handling API errors gracefully", async () => {
        // Mock console.error to avoid cluttering test output
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        fetch.mockRejectedValue(new Error("API Error"));

        render(<DashboardPage />);

        await waitFor(() => {
            // Should eventually stop loading
            const spinner = document.querySelector(".animate-spin");
            expect(spinner).not.toBeInTheDocument();
        });

        // Should still render the layout
        expect(screen.getByText(/good/i)).toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
