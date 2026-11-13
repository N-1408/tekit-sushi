/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A2194", deep: "#0F1720", ink: "#F2F5F9", soft: "#1B2330", line: "#232C39" },
        paper: "#0F1720",
      },
      borderRadius: { xl2: "22px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", drawer: "cubic-bezier(.32,.72,0,1)", spring: "cubic-bezier(.34,1.56,.64,1)" },
    },
  },
  plugins: [],
}
