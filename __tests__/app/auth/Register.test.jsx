import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/(auth)/register/page";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

// Mock next/link
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, ...props }) => <a href={href} {...props}>{children}</a>,
}));

// Mock fetch
global.fetch = jest.fn();

describe("RegisterPage", () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
    });

    it("renders the registration form correctly", () => {
        render(<RegisterPage />);

        expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/roll number/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/course/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/semester/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /register/i })).toBeInTheDocument();
    });

    it("updates input fields when user types", () => {
        render(<RegisterPage />);

        const nameInput = screen.getByPlaceholderText(/full name/i);
        fireEvent.change(nameInput, { target: { value: "John Doe" } });
        expect(nameInput.value).toBe("John Doe");
    });

    it("validates semester input", () => {
        render(<RegisterPage />);

        const semesterInput = screen.getByPlaceholderText(/semester/i);
        expect(semesterInput).toHaveAttribute("min", "1");
        expect(semesterInput).toHaveAttribute("max", "8");
    });

    it("handles successful registration", async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: "Registration successful" }),
        });

        render(<RegisterPage />);

        fireEvent.change(screen.getByPlaceholderText(/roll number/i), { target: { value: "12345" } });
        fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: "John Doe" } });
        fireEvent.change(screen.getByPlaceholderText(/course/i), { target: { value: "CS" } });
        fireEvent.change(screen.getByPlaceholderText(/semester/i), { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /register/i }));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/dashboard");
        });
    });

    it("handles registration failure", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: "User already exists" }),
        });

        render(<RegisterPage />);

        // Fill all required fields
        fireEvent.change(screen.getByPlaceholderText(/roll number/i), { target: { value: "12345" } });
        fireEvent.change(screen.getByPlaceholderText(/full name/i), { target: { value: "John Doe" } });
        fireEvent.change(screen.getByPlaceholderText(/course/i), { target: { value: "CS" } });
        fireEvent.change(screen.getByPlaceholderText(/semester/i), { target: { value: "3" } });
        fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "password123" } });

        fireEvent.click(screen.getByRole("button", { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
        });

        expect(mockPush).not.toHaveBeenCalled();
    });
});
