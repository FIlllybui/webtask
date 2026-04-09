/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slack: {
          sidebar: "#4A154B", // aubergine
          sidebarHover: "#3F1240",
          accent: "#611f69", // vibrant purple
          surface: "#FFFFFF",
          surfaceMuted: "#F8F8F8",
          text: "#1D1C1D",
          sidebarText: "#F5F1F6",
        },
      },
    },
  },
  plugins: [],
};

