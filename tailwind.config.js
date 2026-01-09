/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.{html,js}", "./assets/**/*.js"],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['Fira Code', 'monospace'],
            },
            colors: {
                dark: {
                    900: '#0f0f10',
                    800: '#18181b',
                    700: '#27272a',
                    600: '#3f3f46',
                },
                brand: {
                    500: '#6366f1',
                    600: '#4f46e5',
                }
            }
        },
    },
    plugins: [],
}
