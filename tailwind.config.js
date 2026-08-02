/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F2E8DE",
        card: "#FBF6EF",
        ink: "#2B211C",
        rust: "#B54A2C",
        deeprust: "#7A2E1A",
        sand: "#D9C9B4",
        muted: "#8A7768",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
