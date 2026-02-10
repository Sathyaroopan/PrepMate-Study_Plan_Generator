import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "@/components/Navbar";

// Mock next/image since it requires Next.js server context
jest.mock("next/image", () => ({
    __esModule: true,
    default: ({ priority, ...props }) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} />;
    },
}));

// Mock next/link
jest.mock("next/link", () => ({
    __esModule: true,
    default: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

describe("Navbar", () => {
    beforeEach(() => {
        localStorageMock.clear();
        document.documentElement.removeAttribute("data-theme");
    });

    it("renders the user name", () => {
        render(<Navbar userName="Sathya" />);
        expect(screen.getByText("Sathya")).toBeInTheDocument();
    });

    it("renders the logo images", () => {
        render(<Navbar userName="Sathya" />);
        const logos = screen.getAllByAltText("PrepMate Logo");
        expect(logos.length).toBe(2); // light + dark logo
    });

    it("renders the theme toggle button", () => {
        render(<Navbar userName="Sathya" />);
        // There should be a button for theme toggling (the one with the icon)
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThanOrEqual(2); // theme toggle + user name button
    });

    it("toggles data-theme attribute when theme button is clicked", () => {
        render(<Navbar userName="Sathya" />);

        // Initial state should be light (since matchMedia returns false for dark)
        expect(document.documentElement.getAttribute("data-theme")).toBe("light");

        // Click the theme toggle (first button)
        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[0]); // theme toggle is the first button

        expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("saves theme preference to localStorage on toggle", () => {
        render(<Navbar userName="Sathya" />);

        const buttons = screen.getAllByRole("button");
        fireEvent.click(buttons[0]);

        expect(localStorageMock.setItem).toHaveBeenCalledWith("theme", "dark");
    });
});
