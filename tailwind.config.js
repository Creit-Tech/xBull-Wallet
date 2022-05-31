module.exports = {
  important: true,
  prefix: '',
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{html,ts}',
      './src/assets/i18n/*.json'
    ]
  },
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      maxHeight: {
        '1/10': '10%',
        '2/10': '20%',
        '3/10': '30%',
        '4/10': '40%',
        '5/10': '50%',
        '6/10': '60%',
        '7/10': '70%',
        '8/10': '80%',
        '9/10': '90%',
      }
    },
    colors: {
      // v1
      black: '#141414',
      gray: '#202020',
      white: '#FCFCFC',
      warning: '#be750c',
      danger: '#a61d24',





      // Beta
      'off-black': '#141414',
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
  plugins: [],
};
