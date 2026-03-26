/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/*.css", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      ringWidth: {
        6: "6px",
      },
      borderRadius: {
        lg: "10px",
      },
      borderWidth: {
        2: "1.8px",
      },
      boxShadow: {
        dropdown: "0px 3px 5px rgba(0, 0, 0, 0.05)",
      },
      fontSize: {
        "5xl": "2.8rem",
      },
      colors: {
        white: {
          100: "#f9f9f9",
          200: "#DEDEDE",
        },
        purple: "#9747FF",
        red: {
          100: "#FF7288",
          200: "#FF506C",
          300: "#FF3C5B",
          400: "#F92A4B",
          500: "#EB2142",
          600: "#DB1F3D",
          700: "#C41A35",
          800: "#B41730",
          900: "#BD1630",
        },
        blue: {
          100: "#",
          150: "#",
          200: "#",
          250: "#",
          300: "#5A92A3",
          400: "#347088",
          500: "#204E5F",
          600: "#",
          700: "#",
          800: "#",
        },
        gray: {
          100: "", //to be updated
          200: "", //to be updated
          300: "#89898E",
          350: "#5C5C5C",
          400: "#424242",
          450: "#494949",
          500: "#3A3A3D",
          550: "#353535",
          600: "#2F2F2F",
          650: "#292929",
          700: "#232323",
          750: "#272727",
          800: "#212121",
          850: "#181818",
          900: "#171717",
          950: "#0B0B0B",
        },
        superwhite: "#ffffff",
        notification: {
          success: "#16692D",
          error: "#A6363D",
          warning: "#977A24",
          info: "#424242",
        },
        app: {
          documentChat: "#EC4558",
          codeChat: "#9F2284",
          meetingNotes: "#DDA044",
        },
        notification: {
          success: "#16692D",
          error: "#A6363D",
          warning: "#977A24",
          info: "#424242",
        },
      },
      fontFamily: {
        body: ["Nunito Sans", "sans-serif"],
        headers: ["Roboto", "sans-serif"],
      },
      letterSpacing: {
        normal: ".024em", //custom value for tracking-normal
      },
    },
    screens: {
      xxs: "0px",
      xs: "400px",
      sm: "768px",
      md: "900px",
      lg: "1200px",
      xl: "1500px",
      xxl: "1800px",
      xxxl: "2200px",
    },
  },
  plugins: [
    function ({ addVariant }) {
      // Add custom message-group hover variants
      addVariant("message-group", ".message-group &");
      addVariant("message-group-hover", ".message-group:hover &");
    },
  ],
};
