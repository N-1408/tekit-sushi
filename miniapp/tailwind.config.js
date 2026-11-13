/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#E8462B", deep: "#111114", ink: "#191919", soft: "#F3F4F6", line: "#E8E8EA" },
        paper: "#F7F7F8",
      },
      borderRadius: { xl2: "22px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", drawer: "cubic-bezier(.32,.72,0,1)", spring: "cubic-bezier(.34,1.56,.64,1)" },
    },
  },
  plugins: [],
}
