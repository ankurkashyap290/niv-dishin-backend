const user = require('./user');
const publicRoute = require('./public');
const restaurant = require('./restaurant');
const role = require('./role');
const tag = require('./tag');
const cuisine = require('./cuisine');
const currency = require('./currency');
const popularDish = require('./popularDish');
const dish = require('./dish');
const menu = require('./menu');
const systemReward = require('./systemReward');
const reward = require('./reward');
const review = require('./review');
const menuCategory = require('./menuCategory');

//const whitelist = ['http://localhost:3001/'];

// const corsOptionsDelegate = function(req, callback) {
//   let corsOptions;
//   console.log('whitelist', whitelist);
//   if (whitelist.indexOf(req.header('Origin')) !== -1) {
//     corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
//   } else {
//     corsOptions = { origin: false }; // disable CORS for this request
//   }
//   callback(null, corsOptions); // callback expects two parameters: error and options
// };

/*eslint no-unused-vars: 0*/
const handleError = function(err, req, res, next) {
  if (err) {
    console.log('error', err.message);
    res.json({ status: 'error', data: null, error: err.message });
  }
};

const api = function(server) {
  server.use('/api/users', user, handleError);
  server.use('/api/public', publicRoute, handleError);
  server.use('/api/restaurants', restaurant, handleError);
  server.use('/api/roles', role, handleError);
  server.use('/api/tags', tag, handleError);
  server.use('/api/cuisines', cuisine, handleError);
  server.use('/api/currencies', currency, handleError);
  server.use('/api/popular-dishes', popularDish, handleError);
  server.use('/api/dishes', dish, handleError);
  server.use('/api/menus', menu, handleError);
  server.use('/api/systemRewards', systemReward, handleError);
  server.use('/api/rewards', reward, handleError);
  server.use('/api/reviews', review, handleError);
  server.use('/api/menuCategories', menuCategory, handleError);
};

module.exports = api;
