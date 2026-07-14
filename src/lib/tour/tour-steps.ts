/**
 * Tour step definitions and types for the QBIT Hub Interactive Product Tour.
 */

export type TourTarget =
  | "sidebar"
  | "dashboard"
  | "products"
  | "downloads"
  | "installation"
  | "knowledge"
  | "search"
  | "profile"
  | "settings"
  | "admin"
  | "command-palette"
  | "share";

export interface TourStep {
  id: string;
  target: TourTarget;
  title: string;
  description: string;
  /** CSS selector to highlight (optional — if omitted, shows centered modal) */
  selector?: string;
  /** Side to place the tooltip relative to the highlighted element */
  position?: "bottom" | "top" | "left" | "right" | "center";
}

export interface TourModule {
  id: string;
  name: string;
  icon: string;
  steps: TourStep[];
}

/** All tour modules — covers every important area of QBIT Hub */
export const TOUR_MODULES: TourModule[] = [
  {
    id: "welcome",
    name: "Welcome",
    icon: "waving_hand",
    steps: [
      {
        id: "welcome-1",
        target: "dashboard",
        title: "Welcome to QBIT Hub!",
        description: "Your enterprise control center for installation workflows, driver management, knowledge base, and AI-powered support. This tour will guide you through every key module in about 10 minutes.",
        position: "center",
      },
    ],
  },
  {
    id: "sidebar",
    name: "Sidebar Navigation",
    icon: "menu",
    steps: [
      {
        id: "sidebar-1",
        target: "sidebar",
        title: "Sidebar Navigation",
        description: "This is your primary navigation. Click any item to switch between modules. The active item is highlighted in blue. You can collapse the sidebar for more screen space.",
        selector: "aside",
        position: "right",
      },
    ],
  },
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "dashboard",
    steps: [
      {
        id: "dashboard-1",
        target: "dashboard",
        title: "Home Dashboard",
        description: "Your dashboard shows system status, quick access tiles, featured products, recent activity, and announcements — all at a glance.",
        position: "center",
      },
    ],
  },
  {
    id: "products",
    name: "Product Library",
    icon: "inventory_2",
    steps: [
      {
        id: "products-1",
        target: "products",
        title: "Product Library",
        description: "Browse all QBIT hardware by category. Search by model number, view specifications, download drivers, and watch installation videos.",
        position: "center",
      },
      {
        id: "products-2",
        target: "products",
        title: "Product Details",
        description: "Click any product to see full specifications, features, gallery images, related downloads, and compatible accessories.",
        position: "center",
      },
    ],
  },
  {
    id: "downloads",
    name: "Download Center",
    icon: "settings_input_component",
    steps: [
      {
        id: "downloads-1",
        target: "downloads",
        title: "Driver Download Center",
        description: "Search and download the latest drivers, firmware, SDKs, and utilities. Filter by operating system, category, and release year.",
        position: "center",
      },
      {
        id: "downloads-2",
        target: "downloads",
        title: "Secure Downloads",
        description: "Every download goes through a secure API. Public users can only access public assets. Internal assets require authentication.",
        position: "center",
      },
    ],
  },
  {
    id: "installation",
    name: "Installation Center",
    icon: "build",
    steps: [
      {
        id: "installation-1",
        target: "installation",
        title: "Installation Center",
        description: "Step-by-step installation guides for every QBIT product. Includes required tools, safety instructions, wiring diagrams, and interactive checklists.",
        position: "center",
      },
      {
        id: "installation-2",
        target: "installation",
        title: "Progress Tracking",
        description: "Mark each step as complete, and your progress is saved automatically. Resume any guide from where you left off.",
        position: "center",
      },
    ],
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    icon: "menu_book",
    steps: [
      {
        id: "knowledge-1",
        target: "knowledge",
        title: "Knowledge Base & Troubleshooting",
        description: "Search articles, FAQs, error codes, and troubleshooting guides. The AI Assistant can answer your questions using only QBIT Hub data.",
        position: "center",
      },
    ],
  },
  {
    id: "search",
    name: "Global Search",
    icon: "search",
    steps: [
      {
        id: "search-1",
        target: "command-palette",
        title: "Command Palette (Ctrl + K)",
        description: "Press Ctrl+K (or Cmd+K) anywhere to open the command palette. Search across all products, drivers, guides, and settings. Use arrow keys to navigate, Enter to select.",
        position: "center",
      },
    ],
  },
  {
    id: "profile",
    name: "Profile & Settings",
    icon: "account_circle",
    steps: [
      {
        id: "profile-1",
        target: "profile",
        title: "Profile Menu",
        description: "Click your avatar to access account settings, recent activity, help & support, and sign out. Your role determines which modules you can access.",
        position: "center",
      },
      {
        id: "profile-2",
        target: "settings",
        title: "Theme & Preferences",
        description: "Toggle between Light, Dark, and System themes. Your preference is saved automatically.",
        position: "center",
      },
    ],
  },
  {
    id: "admin",
    name: "Admin Panel",
    icon: "admin_panel_settings",
    steps: [
      {
        id: "admin-1",
        target: "admin",
        title: "Admin Control Center",
        description: "Administrators can manage products, assets, users, roles, announcements, system settings, and view analytics — all from the Admin Dashboard.",
        position: "center",
      },
      {
        id: "admin-2",
        target: "admin",
        title: "CMS & Bulk Operations",
        description: "Import products via Excel/CSV, manage media library, generate QR codes, configure SEO, and export data — all without developer involvement.",
        position: "center",
      },
    ],
  },
  {
    id: "share",
    name: "Share & QR",
    icon: "share",
    steps: [
      {
        id: "share-1",
        target: "share",
        title: "Public Product Pages",
        description: "Every product has a public-facing page with SEO metadata. Share via link, WhatsApp, email, or QR code. Customers can view specs and download public assets without logging in.",
        position: "center",
      },
    ],
  },
  {
    id: "complete",
    name: "Tour Complete",
    icon: "task_alt",
    steps: [
      {
        id: "complete-1",
        target: "dashboard",
        title: "You're All Set!",
        description: "You now know the key modules of QBIT Hub. Use Ctrl+K to quickly find anything. Click the Help button anytime for quick guides and keyboard shortcuts.",
        position: "center",
      },
    ],
  },
];

/** Flatten all steps from all modules into a single array */
export const ALL_TOUR_STEPS: TourStep[] = TOUR_MODULES.flatMap((m) => m.steps);

/** Keyboard shortcuts reference */
export const KEYBOARD_SHORTCUTS = [
  { keys: "Ctrl + K", description: "Open Command Palette" },
  { keys: "Esc", description: "Close dialog / palette" },
  { keys: "↑ ↓", description: "Navigate command palette results" },
  { keys: "Enter", description: "Select command palette item" },
  { keys: "Tab", description: "Move between interactive elements" },
];

/** Quick start guide items */
export const QUICK_START_GUIDE = [
  { title: "Search Products", description: "Use Ctrl+K or the sidebar to browse the product library.", icon: "inventory_2" },
  { title: "Download Drivers", description: "Visit the Driver Download Center for the latest firmware and SDKs.", icon: "download" },
  { title: "Follow Installation Guides", description: "Open the Installation Center for step-by-step setup instructions.", icon: "build" },
  { title: "Ask the AI Assistant", description: "Visit AI Support Center to get instant answers from QBIT Hub data.", icon: "smart_toy" },
  { title: "Manage Content", description: "Admins can use the CMS to import, export, and manage all content.", icon: "admin_panel_settings" },
];
