import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== Kyelos brand palette =====
        forest: {
          DEFAULT: "#1F2D24",
          light: "#2C3D32",
          pale: "#DCE3D6",
        },
        cream: {
          DEFAULT: "#F4EDE0",
          light: "#FAF6EE",
        },
        terracotta: {
          DEFAULT: "#C7785A",
          dark: "#A85E40",
        },
        gold: "#C9A961",
        charcoal: "#2A2A28",

        // ===== Legacy aliases (Tandem + PR Cut → mapped to Kyelos) =====
        // Existing class names render in the new palette even if missed by sed.
        sage: {
          DEFAULT: "#1F2D24",   // forest
          light: "#FAF6EE",     // cream-light
          dark: "#2C3D32",      // forest-light
          pale: "#DCE3D6",      // forest-pale
        },
        navy: {
          DEFAULT: "#1F2D24",
          light: "#F4EDE0",
          dark: "#2C3D32",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        sans: ["var(--font-body)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
