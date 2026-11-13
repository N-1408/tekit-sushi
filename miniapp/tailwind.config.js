/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A2194", deep: "#0B1440", ink: "#0E1839", soft: "#EEF0FA", line: "#E5E8F2" },
        paper: "#F6F7FB",
      },
      borderRadius: { xl2: "22px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", drawer: "cubic-bezier(.32,.72,0,1)", spring: "cubic-bezier(.34,1.56,.64,1)" },
    },
  },
  plugins: [],
}
