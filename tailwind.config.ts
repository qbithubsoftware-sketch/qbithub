import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // shadcn/ui base tokens (HSL CSS vars)
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                // QBIT Hub Material 3 design tokens (hex values from DESIGN.md)
                qbit: {
                    'primary': '#0043c8',
                    'on-primary': '#ffffff',
                    'primary-container': '#0057ff',
                    'on-primary-container': '#e5e8ff',
                    'secondary': '#0051d5',
                    'on-secondary': '#ffffff',
                    'secondary-container': '#316bf3',
                    'on-secondary-container': '#fefcff',
                    'tertiary': '#4e5153',
                    'on-tertiary': '#ffffff',
                    'tertiary-container': '#66696b',
                    'on-tertiary-container': '#e7e9eb',
                    'error': '#ba1a1a',
                    'on-error': '#ffffff',
                    'error-container': '#ffdad6',
                    'on-error-container': '#93000a',
                    'background': '#f9f9ff',
                    'on-background': '#141b2b',
                    'surface': '#f9f9ff',
                    'surface-bright': '#f9f9ff',
                    'surface-dim': '#d3daef',
                    'surface-variant': '#dce2f7',
                    'surface-tint': '#004ee7',
                    'surface-container-lowest': '#ffffff',
                    'surface-container-low': '#f1f3ff',
                    'surface-container': '#e9edff',
                    'surface-container-high': '#e1e8fd',
                    'surface-container-highest': '#dce2f7',
                    'on-surface': '#141b2b',
                    'on-surface-variant': '#434656',
                    'outline': '#737688',
                    'outline-variant': '#c3c5d9',
                    'inverse-surface': '#293040',
                    'inverse-on-surface': '#edf0ff',
                    'inverse-primary': '#b6c4ff',
                    'primary-fixed': '#dce1ff',
                    'primary-fixed-dim': '#b6c4ff',
                    'secondary-fixed': '#dbe1ff',
                    'secondary-fixed-dim': '#b4c5ff',
                    'tertiary-fixed': '#e0e3e5',
                    'tertiary-fixed-dim': '#c4c7c9',
                    'on-primary-fixed': '#001550',
                    'on-primary-fixed-variant': '#003ab2',
                    'on-secondary-fixed': '#00174b',
                    'on-secondary-fixed-variant': '#003ea8',
                    'on-tertiary-fixed': '#191c1e',
                    'on-tertiary-fixed-variant': '#444749',
                }
            },
            fontFamily: {
                sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
                'material-symbols': ['Material Symbols Outlined'],
            },
            fontSize: {
                'display-lg': ['48px', { lineHeight: '56px', fontWeight: '700', letterSpacing: '-0.02em' }],
                'display-md': ['40px', { lineHeight: '48px', fontWeight: '700', letterSpacing: '-0.02em' }],
                'display-sm': ['36px', { lineHeight: '44px', fontWeight: '700', letterSpacing: '-0.02em' }],
                'headline-lg': ['30px', { lineHeight: '38px', fontWeight: '600', letterSpacing: '-0.01em' }],
                'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
                'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
                'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
                'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
                'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
                'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
                'label-sm': ['12px', { lineHeight: '16px', fontWeight: '600', letterSpacing: '0.05em' }],
            },
            spacing: {
                'qbit-xs': '4px',
                'qbit-sm': '8px',
                'qbit-md': '16px',
                'qbit-lg': '24px',
                'qbit-xl': '32px',
                'qbit-2xl': '48px',
                'qbit-3xl': '64px',
                'gutter': '24px',
                'container-max': '1440px',
            },
            maxWidth: {
                'container-max': '1440px',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                xl: '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 10px 15px -3px rgba(17, 24, 39, 0.05), 0 4px 6px -4px rgba(17, 24, 39, 0.05)',
                'soft-lg': '0 20px 25px -5px rgba(17, 24, 39, 0.08), 0 8px 10px -6px rgba(17, 24, 39, 0.05)',
            },
            animation: {
                'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fade-in 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
                'scroll-reveal': 'scroll-reveal 0.6s ease-out',
            },
            keyframes: {
                'pulse-ring': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 67, 200, 0.4)' },
                    '50%': { boxShadow: '0 0 0 8px rgba(0, 67, 200, 0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scroll-reveal': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        }
    },
    plugins: [tailwindcssAnimate],
};
export default config;
