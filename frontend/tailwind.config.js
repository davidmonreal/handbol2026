/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                danger: {
                    high: '#EF4444',    // Red
                    medium: '#F97316',  // Orange
                    low: '#EAB308',     // Yellow
                },
                safe: '#3B82F6',      // Blue
            },
        },
    },
    plugins: [],
}
