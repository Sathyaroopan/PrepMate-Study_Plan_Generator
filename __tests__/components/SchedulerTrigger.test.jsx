import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SchedulerTrigger from "@/components/SchedulerTrigger";

// Mock fetch
global.fetch = jest.fn();

describe("SchedulerTrigger Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Render
    it("renders the 'Generate AI Study Plan' button", () => {
        render(<SchedulerTrigger />);
        expect(screen.getByText("Generate AI Study Plan")).toBeInTheDocument();
    });

    // Test 2: Loading State
    it("shows loading state when clicked", async () => {
        // Mock a delayed response
        fetch.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) }), 100)));

        render(<SchedulerTrigger />);
        const button = screen.getByRole("button");

        fireEvent.click(button);

        expect(screen.getByText("Generating...")).toBeInTheDocument();
        expect(button).toBeDisabled();

        await waitFor(() => expect(screen.getByText("Generate AI Study Plan")).toBeInTheDocument());
    });

    // Test 3: API Call
    it("calls the scheduler API with correct parameters", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionsCreated: 5 }),
        });

        render(<SchedulerTrigger />);
        fireEvent.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/scheduler", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: 7 }),
            });
        });
    });

    // Test 4: Success Handling
    it("displays success message when API returns 200", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionsCreated: 10 }),
        });

        render(<SchedulerTrigger />);
        fireEvent.click(screen.getByRole("button"));

        expect(await screen.findByText("Success: 10 sessions created!")).toBeInTheDocument();
    });

    // Test 5: Callback Execution
    it("calls onPlanGenerated callback on success", async () => {
        const mockCallback = jest.fn();
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessionsCreated: 10 }),
        });

        render(<SchedulerTrigger onPlanGenerated={mockCallback} />);
        fireEvent.click(screen.getByRole("button"));

        await waitFor(() => {
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    // Test 6: Error Handling (API Error)
    it("displays error message when API returns error", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: "Failed to generate" }),
        });

        render(<SchedulerTrigger />);
        fireEvent.click(screen.getByRole("button"));

        expect(await screen.findByText("Error: Failed to generate")).toBeInTheDocument();
    });

    // Test 7: Exception Handling
    it("displays generic error message on fetch exception", async () => {
        fetch.mockRejectedValueOnce(new Error("Network Error"));

        render(<SchedulerTrigger />);
        fireEvent.click(screen.getByRole("button"));

        expect(await screen.findByText("An error occurred")).toBeInTheDocument();
    });
});
