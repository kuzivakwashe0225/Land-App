/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    // @tailwindcss/line-clamp is built into Tailwind CSS v3.3+ — no plugin needed
  ],
};
