/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");
module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/index.html"],
  theme: {
    extend: {
      fontFamily: {
        body: ["Orbitron"],
        Barlow: ["Barlow Condensed"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
});
