/* Data.Studio site configuration — edit freely. */
window.DS_CONFIG = {
  siteUrl: 'https://data.studio',

  /* After the first form submission, FormSubmit emails an activation link and a random alias.
     Paste that alias here (e.g. 'a1b2c3d4e5...') so no address exists in the code at all. */
  formAlias: '',

  /* Direct payment links for the Support page. Leave empty to hide a button.
     Pledge form always works as a fallback. */
  donate: {
    paypal: '',        // e.g. https://www.paypal.com/donate/?hosted_button_id=XXXX or https://paypal.me/yourname
    stripe: '',        // Stripe Payment Link
    buymeacoffee: '',  // https://www.buymeacoffee.com/yourname
    kofi: ''           // https://ko-fi.com/yourname
  },

  /* Monthly Data Viz Challenge. Prizes are shown exactly as written here. */
  contest: {
    prizes: [
      { place: '1st', prize: 'Featured spotlight + top sponsor prize' },
      { place: '2nd', prize: 'Featured spotlight + runner-up prize' },
      { place: '3rd', prize: 'Featured spotlight + community prize' }
    ],
    prizeNote: 'The prize pool is funded by sponsors and supporters and is confirmed on this page before each challenge opens.',
    themes: [
      'Cost of living around the world',
      'Climate & energy transitions',
      'Sport by the numbers',
      'Cities & mobility',
      'Health & life expectancy',
      'The internet economy',
      'Food & agriculture',
      'Money, inflation & exchange rates',
      'Education & skills',
      'Population & migration',
      'Science & space',
      'Year in data'
    ]
  }
};
