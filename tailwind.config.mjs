import defaultTheme from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,md,ts}"],
  theme: {
    extend: {
      fontFamily: {
        "sans": ["Atkinson", ...defaultTheme.fontFamily.sans],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "full",
          },
        },
      },
    },
  },
  plugins: [],
}
