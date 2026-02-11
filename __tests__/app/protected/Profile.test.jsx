import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "@/app/(protected)/profile/page";

// Mock fetch
global.fetch = jest.fn();

describe("ProfilePage", () => {
    const mockProfile = {
        name: "John Doe",
        rollNumber: "123",
        course: "CS",
        semester: "3",
        courses: ["Math", "Physics"],
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation to avoid unhandled rejections
        fetch.mockImplementation(() => Promise.resolve({
            ok: true,
            json: async () => ({}),
        }));
    });

    it("renders loading state", () => {
        fetch.mockImplementation(() => new Promise(() => { }));
        render(<ProfilePage />);
        expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
    });

    it("fetches and displays profile data", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProfile,
        });

        render(<ProfilePage />);

        await waitFor(() => {
            expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
            expect(screen.getByDisplayValue("123")).toBeInTheDocument();
            expect(screen.getByText("Math")).toBeInTheDocument();
            expect(screen.getByText("Physics")).toBeInTheDocument();
        });
    });

    it("updates profile fields", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProfile,
        });

        render(<ProfilePage />);
        await waitFor(() => screen.getByDisplayValue("John Doe"));

        const nameInput = screen.getByPlaceholderText(/e.g. John Doe/i);
        fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
        expect(nameInput.value).toBe("Jane Doe");
    });

    it("adds and removes courses", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ ...mockProfile, courses: [] }),
        });

        render(<ProfilePage />);
        await waitFor(() => screen.getByText(/no courses added/i));

        // Add Course
        const courseInput = screen.getByPlaceholderText(/enter subject name/i);
        fireEvent.change(courseInput, { target: { value: "Chemistry" } });
        fireEvent.click(screen.getByText("Add"));

        expect(screen.getByText("Chemistry")).toBeInTheDocument();
        expect(courseInput.value).toBe(""); // Should clear input

        // Remove Course
        fireEvent.click(screen.getByText("Remove"));
        expect(screen.queryByText("Chemistry")).not.toBeInTheDocument();
    });

    it("saves profile changes", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockProfile,
        });

        // Mock save response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<ProfilePage />);
        await waitFor(() => screen.getByDisplayValue("John Doe"));

        // Change Name
        fireEvent.change(screen.getByPlaceholderText(/e.g. John Doe/i), { target: { value: "Jane Doe" } });

        // Click Save
        fireEvent.click(screen.getByText("Update Profile"));

        expect(screen.getByText("Saving Changes...")).toBeInTheDocument();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                "/api/auth/profile",
                expect.objectContaining({
                    method: "POST",
                    body: expect.stringContaining("Jane Doe"),
                })
            );
        });

        // Should revert to "Update Profile" after save
        await waitFor(() => {
            expect(screen.getByText("Update Profile")).toBeInTheDocument();
        });
    });
});
