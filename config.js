const configs = function() {
  switch (process.env.NODE_ENV) {
    // case 'development':
    //   return {
    //     APP_URL: 'https://demo.local',
    //     API_URL: 'http://localhost:8282/api',
    //     API_IMAGE_URL: 'http://localhost:8282',
    //     MONGO_HOST: 'localhost',
    //     MONGO_PORT: '27017',
    //     MONGO_DB_NAME: 'dishin',
    //   };

    // case 'production':
    //   return {
    //     APP_URL: 'https://dishin.mindzhub.com',
    //     API_URL: 'https://dishinapi.mindzhub.com/api',
    //     API_IMAGE_URL: 'http://localhost:8282',
    //     MONGO_HOST: 'localhost',
    //     MONGO_PORT: '28000',
    //     MONGO_DB_NAME: 'dishin',
    //   };

    default:
      return {
        APP_URL: 'http://localhost:3001',
        API_URL: 'http://localhost:8282/api',
        API_IMAGE_URL: 'http://localhost:8282',
        MONGO_HOST: 'localhost',
        MONGO_PORT: '27017',
        MONGO_DB_NAME: 'dishin_live',
      };
  }
};
const priceRanges = [
  { value: '30-50', unit: '$' },
  { value: '51-70', unit: '$' },
  { value: '71-100', unit: '$' },
  { value: '>100', unit: '$' },
];
const distanceToMe = [
  { value: '0-5', unit: 'km' },
  { value: '5-15', unit: 'km' },
  { value: '20-30', unit: 'min' },
  { value: '31-60', unit: 'min' },
  { value: '>1', unit: 'hour' },
];

const emailSetting = {
  userName: 'apikey',
  pass: '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',
  emailAddress: 'piyush.sharma@mind2minds.com',
};

const settings = {
  ...configs(),
  priceRanges,
  distanceToMe,
  emailSetting,
};

module.exports = settings;
