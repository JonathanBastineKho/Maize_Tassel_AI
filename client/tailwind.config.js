const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", flowbite.content(),],
  theme: {
    extend: {
      colors : { 
        "primary_green" : "#059669",
        "focus_green" : "#D1FAE5",
        "enabled_green" : "#065F46",
      }
    },
  },
  plugins: [
    flowbite.plugin({ charts: true }),
  ],
}

