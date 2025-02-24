/*eslint no-unused-vars: [0]*/
const express = require('express');
const router = express.Router();
const UserTokens = require('../models/UserToken');
const Users = require('../models/User');
const Dish = require('../models/Dish');
const Review = require('../models/Review');
const RestaurantLocation = require('../models/RestaurantLocation');
const { Common, authenticateToken } = require('../misc/common');
const settings = require('../config');
const Contribute = require('../models/Contribute');
const Restaurant = require('../models/Restaurant');
const ReservationRequest = require('../models/ReservationRequest');
const Menu = require('../models/Menu');
const images = require('../models/File');
const MenuCategory = require('../models/MenuCategory');
const { resultOk, filterPriceCond, distanceToMeCond, resultError } = require('./helper');
const slug = require('slug');
const fs = require('fs');
const jwt = require('../misc/jwt_token');

const resetUserPassword = async function(data, userId) {
  let password = await Common.hashPassword(data.password);
  let passwordError = await Common.checkPassword(data.password, data.confirmPassword);
  if (!passwordError) {
    let user = await Users.updateOne({ _id: userId }, { password: password });
    if (user) {
      return user;
    } else {
      throw new Error('Password not updated');
    }
  } else {
    throw new Error(passwordError);
  }
};

router.get('/verify-email/', async function(req, res, next) {
  const token = req.query.token;
  let result = {};
  try {
    let checkValidToken = await UserTokens.findOne({
      token: token,
    });
    if (checkValidToken) {
      let userStatusUpdate = await Users.updateOne(
        { _id: checkValidToken.user_id },
        { status: 'active' }
      );
      if (userStatusUpdate.ok === 1) {
        await UserTokens.deleteOne({ _id: checkValidToken._id });
        result = {
          status: 'ok',
          info: `Success! Your Status updated.`,
          data: {},
          verifyStatus: 'Email verified successfully',
        };
      } else {
        result = {
          status: 'error',
          error: 'Status updating process failed.',
          verifyStatus: 'Email verified failed',
        };
      }
    } else {
      result = {
        status: 'error',
        error: 'Token did not matched.',
        verifyStatus: 'Invalid Token',
      };
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', async function(req, res, next) {
  let token = req.query.token;
  let result = {};
  try {
    let checkValidToken = await UserTokens.findOne({
      token: token,
      expire_date: { $gt: Date.now() },
    });
    if (checkValidToken) {
      let resetUser = await resetUserPassword(req.body, checkValidToken.user_id);
      if (resetUser) {
        await UserTokens.deleteOne({ _id: checkValidToken._id });
        result = {
          status: 'ok',
          info: 'Success! Your password has been changed.',
          data: {},
        };
      } else {
        result = {
          status: 'error',
          error: 'Password updating failed.',
        };
      }
    } else {
      result = {
        status: 'error',
        error: 'Password reset token is invalid or has expired.',
      };
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/check-reset-token', async function(req, res, next) {
  let token = req.query.token;
  let result = {};
  try {
    let checkValidToken = await UserTokens.findOne({
      token: token,
      expire_date: { $gt: Date.now() },
    });
    if (checkValidToken) {
      result = {
        status: 'ok',
        info: 'valid token',
        isTokenValid: true,
      };
    } else {
      result = {
        status: 'ok',
        info: 'Token is invalid or has expired.',
        isTokenValid: false,
      };
    }
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

const getTmpCount = async function(model, condition) {
  return await model.countDocuments(condition).exec();
};

router.get('/price-range', async function(req, res, next) {
  try {
    const priceRanges = [];
    for (const index in settings.priceRanges) {
      const priceRange = settings.priceRanges[index];
      priceRange.totalCount = await getTmpCount(Dish, filterPriceCond(priceRange.value));
      priceRanges.push(priceRange);
    }
    res.json(resultOk(priceRanges, 'Total Available Price Ranges'));
  } catch (err) {
    next(err);
  }
});

router.get('/distance-to-me', async function(req, res, next) {
  try {
    const dtmData = [];
    const lng = req.query.lng;
    const lat = req.query.lat;
    for (const index in settings.distanceToMe) {
      const dtmRec = settings.distanceToMe[index];
      const { minDistance, maxDistance } = distanceToMeCond(`${dtmRec.value}-${dtmRec.unit}`);
      const result = await RestaurantLocation.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distance',
            spherical: true,
          },
        },
        {
          $match: {
            distance: { $gte: minDistance, $lte: maxDistance },
          },
        },
      ])
        // .where('loc')
        // .near({ center: [34.7874134, 32.0785738], maxDistance, minDistance, spherical: true })
        .exec();
      dtmRec.totalCount = result.length;
      dtmData.push(dtmRec);
    }
    res.json(resultOk(dtmData, 'Total Available Distance To Me'));
  } catch (err) {
    next(err);
  }
});

router.get('/search-by', async function(req, res, next) {
  let restaurantsCount = await getTmpCount(Restaurant);
  let dishesCount = await getTmpCount(Dish);
  let result = {
    restaurantsCount,
    dishesCount,
    totalCount: restaurantsCount + dishesCount,
  };
  res.json(resultOk(result, 'Search by count'));
});

router.post('/contribute', function(req, res, next) {
  let data = req.body;
  try {
    const insertObj = {
      userId: data.userId,
      restaurantName: data.restaurantName,
      dishName: data.dishName,
      city: data.city,
      dishScore: data.dishScore,
    };
    Contribute.create(insertObj)
      .then(response => {
        res.json(resultOk(response.toJSON(), 'Tag is added successfully'));
      })
      .catch(err => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.post('/reservation-request', function(req, res, next) {
  let data = req.body;
  try {
    const insertObj = {
      restaurantId: data.restaurantId,
      name: data.name,
      phone: data.phone,
      reservationDate: data.reservationDate,
    };
    ReservationRequest.create(insertObj)
      .then(response => {
        res.json(resultOk(response.toJSON(), 'Reservation Request is added successfully'));
      })
      .catch(err => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.get('/update-restaurant-slug', function(req, res, next) {
  Restaurant.find().then(records => {
    const allPromise = records.map(restaurant => {
      restaurant.slug = slug(restaurant.name, { lower: true });
      return restaurant.save();
    });
    Promise.all(allPromise)
      .then(result => {
        res.json(resultOk({ result }, 'Restaurant Slug updated'));
      })
      .catch(err => {
        next(err);
      });
  });
});

router.get('/update-dish-slug', function(req, res, next) {
  Dish.find().then(records => {
    const allPromise = records.map(dish => {
      dish.slug = slug(dish.name, { lower: true });
      return dish.save();
    });
    Promise.all(allPromise)
      .then(result => {
        res.json(resultOk({ result }, 'dish Slug updated'));
      })
      .catch(err => {
        next(err);
      });
  });
});

router.get('/get-restaurant-menus', function(req, res, next) {
  Menu.find()
    .select('name')
    .populate({ path: 'category', select: 'name' })
    .populate({ path: 'restaurant_id', select: 'name' })
    .then(records => {
      res.json(resultOk({ menus: records }, 'Fetched'));
    })
    .catch(next);
});

function checkDirectory(currentDir, imageDir, next) {
  let tempDirArr = imageDir.split('/');
  let tempCurrentDir = currentDir;
  tempDirArr.forEach(el => {
    if (!fs.existsSync(`${tempCurrentDir}/${el}`)) {
      tempCurrentDir = `${tempCurrentDir}/${el}`;
      fs.mkdirSync(tempCurrentDir, { recursive: true, mode: 777 });
    } else {
      tempCurrentDir = `${tempCurrentDir}${el}/`;
    }
  });
  return tempCurrentDir;
}

function addOrUpdateImage(name, path, userId, dishId, type, req, res, next) {
  images
    .find({ name, path, type })
    .then(imageExists => {
      if (imageExists.length) {
        images
          .updateOne({ _id: imageExists._id }, { name, path })
          .then(() => {
            Review.find({ userId, typeId: dishId })
              .then(review => {
                Review.updateOne({ _id: review[0]._id }, { images: imageExists[0]._id })
                  .then(updated => {
                    res.json(resultOk(imageExists, 'image saved successfully'));
                  })
                  .catch(err => {
                    next(err);
                  });
              })
              .catch(err => {
                next(err);
              });
          })
          .catch(err => {
            next(err);
          });
      } else {
        let obj = {
          name,
          path,
          isLogo: false,
          type,
        };
        images
          .create(obj)
          .then(images => {
            Review.find({ userId, typeId: dishId })
              .then(review => {
                Review.updateOne({ _id: review[0]._id }, { images: images._id })
                  .then(updated => {
                    res.json(resultOk(images, 'image saved successfully'));
                  })
                  .catch(err => {
                    next(err);
                  });
              })
              .catch(err => {
                next(err);
              });
          })
          .catch(err => {
            next(err);
          });
      }
    })
    .catch(err => {
      next(err);
    });
}

function addOrUpdateUserImage(path, name, userId, type, req, res, next) {
  images
    .find({ name, type })
    .then(imageExists => {
      if (imageExists.length) {
        images
          .updateOne({ _id: imageExists[0]._id }, { name, path })
          .then(() => {
            Users.find({ _id: userId })
              .then(user => {
                Users.updateOne({ _id: user[0]._id }, { image: imageExists[0]._id })
                  .then(updated => {
                    if (updated.ok) {
                      getUpdatedUser(userId, req, res, next);
                    } else {
                      res.json(resultOk(null, 'User update failed'));
                    }
                  })
                  .catch(err => {
                    next(err);
                  });
              })
              .catch(err => {
                next(err);
              });
          })
          .catch(err => {
            next(err);
          });
      } else {
        let obj = {
          name,
          path,
          isLogo: false,
          type,
        };
        images
          .create(obj)
          .then(images => {
            Users.find({ _id: userId })
              .then(user => {
                Users.updateOne({ _id: user[0]._id }, { image: images._id })
                  .then(updated => {
                    if (updated.ok) {
                      getUpdatedUser(userId, req, res, next);
                    } else {
                      res.json(resultOk(null, 'User update failed'));
                    }
                  })
                  .catch(err => {
                    next(err);
                  });
              })
              .catch(err => {
                next(err);
              });
          })
          .catch(err => {
            next(err);
          });
      }
    })
    .catch(err => {
      next(err);
    });
}

function getUpdatedUser(userId, req, res, next) {
  Users.findOne({ _id: userId })
    .populate({ path: 'image' })
    .then(user => {
      if (user) {
        let token = jwt.genJWTToken(user);
        res.json(resultOk({ token }, 'User updated successfully'));
      } else {
        res.json(resultError(null, 'User update failed'));
      }
    })
    .catch(err => {
      next(err);
    });
}

router.post('/save-capture-image', authenticateToken, function(req, res, next) {
  let data = req.body;
  const imageData = data.imageData;
  const imageName = data.imageName;
  const slug = data.slug;
  const type = data.type;
  const user = req.decodedToken;
  const userId = user.user_id;
  const dishId = data.dishId;
  let currentDir = __dirname.split('/');
  currentDir.splice(currentDir.length - 1, 1);
  currentDir = currentDir.join('/');

  var buf = new Buffer(imageData, 'base64');
  try {
    let dir = checkDirectory(currentDir, data.imagePath, next);
    if (dir) {
      fs.writeFile(`${dir}/${imageName}.png`, buf, function(err) {
        if (err) {
          next(err);
        } else {
          if (type === 'Review') {
            addOrUpdateImage(`${imageName}.png`, slug, userId, dishId, type, req, res, next);
          } else if (type === 'User') {
            addOrUpdateUserImage(`${imageName}.png`, user.email, userId, type, req, res, next);
          }
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
