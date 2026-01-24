/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: '#FCD34D', // Yellow-400
                surface: '#09090b', // Zinc-950
                glass: 'rgba(24, 24, 27, 0.6)',
            },
            screens: {
                'xs': '375px',
            },
        },
    },
    plugins: [],
}
