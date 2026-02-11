import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("LoginPage", () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
    });

    it("renders the login form correctly", () => {
        render(<LoginPage />);

        expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your roll number/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("updates input fields when user types", () => {
        render(<LoginPage />);

        const rollInput = screen.getByPlaceholderText(/enter your roll number/i);
        const passwordInput = screen.getByPlaceholderText(/enter your password/i);

        fireEvent.change(rollInput, { target: { value: "12345" } });
        fireEvent.change(passwordInput, { target: { value: "password123" } });

        expect(rollInput.value).toBe("12345");
        expect(passwordInput.value).toBe("password123");
    });

    it("handles successful login", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Login successful" }),
        });

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText(/enter your roll number/i), { target: { value: "12345" } });
        fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        expect(screen.getByText(/signing in/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("handles failed login and displays error", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "Invalid credentials" }),
        });

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText(/enter your roll number/i), { target: { value: "wrong" } });
        fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "wrong" } });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalled();
    });

    it("handles network error", async () => {
        fetch.mockRejectedValueOnce(new Error("Network Error"));

        render(<LoginPage />);

        fireEvent.change(screen.getByPlaceholderText(/enter your roll number/i), { target: { value: "user" } });
        fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "pass" } });

        fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        });
    });
});
