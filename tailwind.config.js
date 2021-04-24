module.exports = {
  prefix: '',
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{html,ts}',
    ]
  },
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
    colors: {
      'off-black': '#14142B',
      'ash': '#262338',
      'body': '#4E4B66',
      'label': '#6E7191',
      'placeholder': '#A0A3BD',
      'line': '#D9DBE9',
      'input': '#EFF0F6',
      'background': '#F7F7FC',
      'off-white': '#FCFCFC',
      'primary': '#C19CFC',
      'success': '#4CFFA6',
      'error': '#FF5DA1',
      'primary-alternative': '#6308F7',
      'success-alternative': '#00CC67',
      'error-alternative': '#E40173',
      'transparent': 'rgba(0,0,0,0)'
    }
  },
  variants: {
    extend: {},
  },
  plugins: [
    // We use the strategy class to avoid undesired classes on elements
    require("@tailwindcss/forms")({
      strategy: 'class',
    })
  ],
};
