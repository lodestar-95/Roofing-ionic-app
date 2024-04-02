export let AppConfig = {
  ERROR_LOGIN: {
    TITLE: 'There was a problem',
    MESSAGE: 'Your email or password is incorrect. Please try again.',
  },
  ERROR_SERVER: {
    TITLE: 'Ups!',
    MESSAGE: 'We have a problem, please try again later.',
  },
  ERROR_LONG_TIME_LOGIN: {
    TITLE: 'Long time no see',
    MESSAGE:
      'You have more than # days without entering in online mode. Please connect to the internet to login.',
  },
  BTN_ACCEPT: 'Accept',
  FORGET_PASSWORD: {
    TITLE: 'Password reset email sent',
    MESSAGE:
      'If your email is correct, you will receive an email with the direction to reset your password.',
  },
  MENU_OPTIONS: [
    {
      id: 1,
      name: 'Roof inspection',
      url: '/home/prospecting/detail/',
      active: true,
    },
    {
      id: 2,
      name: 'Estimates',
      url: '/home/estimate',
      active: false,
    },
    {
      id: 3,
      name: 'Scope of work',
      url: '/home/scope-of-work',
      active: false,
    },
    {
      id: 4,
      name: 'Proposal Preview',
      url: '/pdf-viewer-page',
      //
      active: false,
    },
  ],
  FRACTIONS_CATALOG: [
    {
      id: 1,
      option: '0',
      selected: false,
    },
    {
      id: 2,
      option: '1/8',
      selected: false,
    },
    {
      id: 3,
      option: '1/4',
      selected: false,
    },
    {
      id: 4,
      option: '3/8',
      selected: false,
    },
    {
      id: 5,
      option: '1/2',
      selected: false,
    },
    {
      id: 6,
      option: '5/8',
      selected: false,
    },
    {
      id: 7,
      option: '3/4',
      selected: false,
    },
    {
      id: 8,
      option: '7/8',
      selected: false,
    },
  ],
};
