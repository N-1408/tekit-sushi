/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0A2194", deep: "#0B1440", ink: "#0E1839", soft: "#EEF0FA", line: "#E5E8F2" },
        accent: { DEFAULT: "#FF6A2B", deep: "#F2541B", soft: "#FFF0E8" },
        sky2: "#29A8E0",
        paper: "#F6F7FB",
      },
      borderRadius: { xl2: "22px" },
      boxShadow: {
        card: "0 2px 14px -4px rgba(14,24,57,.08)",
        pop: "0 18px 44px -18px rgba(14,24,57,.28)",
        btn: "0 10px 22px -10px rgba(10,33,148,.55)",
      },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", drawer: "cubic-bezier(.32,.72,0,1)", spring: "cubic-bezier(.34,1.56,.64,1)" },
    },
  },
  plugins: [],
}
