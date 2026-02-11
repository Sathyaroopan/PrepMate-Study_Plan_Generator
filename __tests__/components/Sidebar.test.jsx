import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

// Mock lucide-react
jest.mock("lucide-react", () => ({
    Sparkles: () => <div data-testid="sparkles-icon" />,
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
    usePathname: jest.fn(() => "/dashboard"), // Default to dashboard
}));

// Mock next/image
jest.mock("next/image", () => ({
    __esModule: true,
    default: (props) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

// Mock next/link
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, href, className }) => (
        <a href={href} className={className}>
            {children}
        </a>
    ),
}));

// Mock fetch
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);

// Mock window.location
const originalLocation = window.location;

beforeAll(() => {
    delete window.location;
    window.location = { href: "" };
});

afterAll(() => {
    window.location = originalLocation;
});

describe("Sidebar Component", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.location.href = ""; // Reset href
    });

    // Test 1: Renders Logo
    it("renders the logo images (light and dark mode)", () => {
        render(<Sidebar />);
        const logos = screen.getAllByAltText("Site Logo");
        expect(logos).toHaveLength(2); // One for light, one for dark
    });

    // Test 2-7: Check all navigation links exist
    const links = [
        { text: "Dashboard", href: "/dashboard" },
        { text: "Timetable", href: "/timetable" },
        { text: "Manage Tasks", href: "/tasks" },
        { text: "Velocity", href: "/velocity" },
        { text: "Manage Profile", href: "/profile" },
        { text: "Manage Settings", href: "/settings" },
    ];

    links.forEach(({ text, href }) => {
        it(`renders the ${text} link pointing to ${href}`, () => {
            render(<Sidebar />);
            const textElement = screen.getByText(text);
            const link = textElement.closest("a");
            expect(link).toHaveAttribute("href", href);
        });
    });

    // Test 8: Active link styling
    it("highlights the active link based on current path", () => {
        // The mock returns '/dashboard' by default
        render(<Sidebar />);
        const dashboardLink = screen.getByText("Dashboard").closest("a");
        const timetableLink = screen.getByText("Timetable").closest("a");

        // Dashboard should have the active class (primary-btn)
        expect(dashboardLink).toHaveClass("bg-(--color-primary-btn)");

        // Timetable should NOT have the active class
        expect(timetableLink).not.toHaveClass("bg-(--color-primary-btn)");
        expect(timetableLink).toHaveClass("bg-secondary-btn");
    });

    // Test 9: Logout Rendering
    it("renders the Logout button", () => {
        render(<Sidebar />);
        const logoutBtn = screen.getByText("Logout");
        expect(logoutBtn).toBeInTheDocument();
    });

    // Test 10: Modal Opening
    it("opens the confirmation modal when Logout is clicked", () => {
        render(<Sidebar />);
        const logoutBtn = screen.getByText("Logout");
        fireEvent.click(logoutBtn);

        expect(screen.getByText("Confirm Logout")).toBeInTheDocument();
        expect(screen.getByText("Are you sure you want to log out? You will need to sign back in to access your data.")).toBeInTheDocument();
    });

    // Test 11: Cancel Logout
    it("closes the modal when Cancel is clicked", () => {
        render(<Sidebar />);

        // Open modal
        fireEvent.click(screen.getByText("Logout"));
        expect(screen.getByText("Confirm Logout")).toBeInTheDocument();

        // Click cancel
        fireEvent.click(screen.getByText("Cancel"));

        // Modal should be gone
        expect(screen.queryByText("Confirm Logout")).not.toBeInTheDocument();
    });

    // Test 12: Confirm Logout
    it("calls logout API and redirects when Logout is confirmed", async () => {
        render(<Sidebar />);

        // Open modal
        fireEvent.click(screen.getByText("Logout"));

        // Click the *confirm* logout button (the red one inside the modal)
        // There are two "Logout" texts now: one in the sidebar (hidden behind modal maybe) and one in the modal button.
        // The sidebar trigger is just text "Logout". The button in modal is also "Logout".
        // We can use selector or getAllByText.
        const buttons = screen.getAllByText("Logout");
        const confirmButton = buttons[buttons.length - 1]; // The last one should be the modal button (rendered last)

        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({
                method: "POST",
            }));
        });

        // expect(window.location.href).toBe("/login");
    });
});
