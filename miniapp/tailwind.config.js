/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A2194", deep: "var(--bg)", ink: "var(--ink)", soft: "var(--soft)", line: "var(--line)" },
        paper: "var(--bg)",
      },
      borderRadius: { xl2: "22px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", drawer: "cubic-bezier(.32,.72,0,1)", spring: "cubic-bezier(.34,1.56,.64,1)" },
    },
  },
  plugins: [],
}
