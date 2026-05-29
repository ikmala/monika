/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        poppinsBold: ["Poppins-Bold"],
        poppinsMedium: ["Poppins-Medium"],
        poppinsRegular: ["Poppins-Regular"],
        interBold: ["Inter-Bold"],
        interMedium: ["Inter-Medium"],
        interRegular: ["Inter-Regular"],
      },
      colors: {
        primary: "#002A58",
        secondary: "#7597BD",
        background: "#FFFFFF",
        success: "#10B981",
        error: "#EF4444",
        hore: "#195EA9",
      },
    },
  },
  plugins: [],
};
