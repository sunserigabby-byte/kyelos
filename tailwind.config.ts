import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== Tandem brand palette =====
        sage: {
          DEFAULT: "#9DAA92",
          dark: "#4A5A40",
          pale: "#DCE3D6",
        },
        cream: "#F7F2E8",
        terracotta: {
          DEFAULT: "#C7785A",
          dark: "#A85E40",
        },
        charcoal: "#2A2A28",

        // ===== Legacy aliases (mapped to new palette) =====
        // Any remaining navy/gold class names from before the rebrand still
        // render in the new palette. New code should use sage/cream/terracotta.
        navy: {
          DEFAULT: "#9DAA92",   // sage (primary surface)
          light: "#F7F2E8",     // cream (subtle bg)
          dark: "#4A5A40",      // sage-dark (hover/deep)
        },
        gold: {
          DEFAULT: "#C7785A",   // terracotta
          light: "#DCE3D6",     // sage-pale
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Manrope", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
