/*eslint no-unused-vars: [0]*/
const express = require('express');
const router = express.Router();
const RestaurantLocation = require('../models/RestaurantLocation');
const Restaurant = require('../models/Restaurant');
const Tag = require('../models/Tag');
const Dish = require('../models/Dish');
const Menu = require('../models/Menu');
const MenuCategory = require('../models/MenuCategory');
const Currency = require('../models/Currency');
const Review = require('../models/Review');
const Image = require('../models/Image');
const { resultOk, resultError, filterPriceCond, distanceToMeCond } = require('./helper');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const jwt = require('../misc/jwt_token');

const getTagId = function(req, res, next) {
  let filters = req.query.filters || {};
  let tags = filters.tags || [];
  if (tags.length) {
    Tag.find({ name: { $in: tags } }, '_id')
      .then(records => {
        req.query.filters.tags = records.map(item => item._id);
        next();
      })
      .catch(err => {
        next(err);
      });
  } else {
    next();
  }
};

const getToken = function(req, res, next) {
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
  if (token.startsWith('Bearer')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }
  if (token) {
    jwt
      .verifyJWTToken(token)
      .then(response => {
        req.user = response;
        next();
      })
      .catch(err => next(err));
  } else {
    next();
  }
};

router.get('/autocomplete', async function(req, res, next) {
  const name = req.query.name;
  const lat = req.query.lat;
  const lng = req.query.lng;
  let result = {};
  try {
    const regex = new RegExp(name, 'i');
    let response = null;
    if (lat && lng) {
      const miles = 5 / 3963.2; //searching five miles from the user
      response = await RestaurantLocation.find({
        loc: {
          $geoWithin: { $centerSphere: [[lng, lat], miles] },
        },
      })
        .populate({
          path: 'restaurant_id',
          match: { name: { $regex: regex } },
          populate: { path: 'images' },
        })
        .select('name address loc');
    } else {
      response = await RestaurantLocation.find()
        .populate({
          path: 'restaurant_id',
          match: { name: { $regex: regex } },
          populate: { path: 'images' },
        })
        .select('name address loc');
    }
    if (response) {
      response = response.filter(rec => {
        return rec.restaurant_id != null;
      });
      result = {
        status: 'ok',
        info: 'matched restaurants',
        data: response,
      };
    } else {
      result = {
        status: 'error',
        error: 'no restaurant found',
        data: null,
      };
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/search', getTagId, getToken, function(req, res, next) {
  /*
    Search by Restaurant name
    Filter by {tags, price, distance}
    sort by {name, direction}
  */

  let tagQuery = null;
  let priceRangeQuery = null;
  let distanceSort = null;
  let distanceFilter = null;
  let sortQuery = null;
  let distanceCalculator = null;
  let priceFilter = null;

  const searchText = req.query.searchText || '';
  let filters = req.query.filters || {};
  const defaultFilters = { tags: [], price: '', distance: {} };
  filters = { ...defaultFilters, ...filters };
  const regex = new RegExp(searchText, 'i');
  const sort = req.query.sort || 'rate';
  const sortOrder = req.query.direction === 'asc' ? 1 : -1;
  const searchBy = filters.searchBy || 'everywhere';
  const userId = req.user ? req.user.user_id : null;

  if (filters.tags.length) {
    tagQuery = { tags: { $in: filters.tags } };
  }

  if (sort && sort === 'price') {
    sortQuery = { $sort: { price: sortOrder } };
  }

  if (sort && sort === 'rate') {
    sortQuery = { $sort: { totalRatings: sortOrder } };
  }

  let distanceToMe = filters.distanceToMe || '';
  let hasLocation = filters.location && filters.location.lng && filters.location.lat;
  if (hasLocation) {
    distanceCalculator = {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(filters.location.lng), parseFloat(filters.location.lat)],
        },
        distanceField: 'distance',
        spherical: true,
      },
    };
  }
  if (hasLocation && (sort === 'distance' || distanceToMe.length)) {
    if (hasLocation && sort == 'distance') {
      distanceSort = {
        $sort: {
          distance: sortOrder,
        },
      };
    }
    if (hasLocation && distanceToMe.length) {
      const { minDistance, maxDistance } = distanceToMeCond(distanceToMe);
      distanceFilter = {
        $match: {
          distance: { $gte: minDistance, $lte: maxDistance },
        },
      };
    }
  }

  let restAggregates = [];
  if (distanceCalculator != null) {
    restAggregates.push(distanceCalculator);
  }

  restAggregates.push({
    $lookup: {
      from: 'restaurants',
      localField: 'restaurant_id',
      foreignField: '_id',
      as: 'restaurant_id',
    },
  });

  restAggregates.push({
    $unwind: { path: '$restaurant_id' },
  });

  restAggregates.push({
    $lookup: {
      from: 'images',
      localField: 'restaurant_id.images',
      foreignField: '_id',
      as: 'restaurant_id.images',
    },
  });

  if (searchText) {
    restAggregates.push({
      $match: {
        $or: [
          { 'restaurant_id.name': { $regex: regex } },
          { address: { $regex: regex } },
          { 'restaurant_id.desc': { $regex: regex } },
        ],
      },
    });
  }

  if (filters.tags.length) {
    restAggregates.push({
      $match: { tags: { $in: filters.tags } },
    });
  }

  restAggregates.push({
    $lookup: {
      from: 'dishes',
      let: { rest_id: '$restaurant_id._id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                {
                  $eq: ['$restaurant_id', '$$rest_id'],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: '$restaurant_id',
            totalReviews: { $sum: '$totalReviews' },
          },
        },
      ],
      as: 'dishes',
    },
  });

  restAggregates.push({
    $unwind: { path: '$dishes' },
  });
  if (sort === 'rate') {
    restAggregates.push({
      $sort: { 'dishes.totalReviews': sortOrder },
    });
  }

  if (distanceFilter) {
    restAggregates.push(distanceFilter);
  }
  if (distanceSort) {
    restAggregates.push(distanceSort);
  }

  let dishAggregates = [];
  if (filters.price.length) {
    const priceRangeQuery = filterPriceCond(filters.price);
    priceFilter = {
      $match: { ...priceRangeQuery },
    };
  }
  if (filters.tags.length) {
    dishAggregates.push({
      $match: { tags: { $in: filters.tags } },
    });
  }
  dishAggregates.push({
    $lookup: {
      from: 'restaurants',
      localField: 'restaurant_id',
      foreignField: '_id',
      as: 'restaurant_id',
    },
  });

  dishAggregates.push({
    $lookup: {
      from: 'tags',
      localField: 'tags',
      foreignField: '_id',
      as: 'tags',
    },
  });
  dishAggregates.push({
    $lookup: {
      from: 'images',
      localField: 'images',
      foreignField: '_id',
      as: 'images',
    },
  });

  if (userId) {
    dishAggregates.push({
      $lookup: {
        from: 'reviews',
        let: { dish_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$typeId', '$$dish_id'],
                  },
                  {
                    $eq: ['$userId', mongoose.Types.ObjectId(userId)],
                  },
                ],
              },
            },
          },
        ],
        as: 'reviews',
      },
    });
  }

  if (priceFilter) {
    dishAggregates.push(priceFilter);
  }
  if (searchText) {
    dishAggregates.push({
      $match: {
        $or: [{ name: { $regex: regex } }, { description: { $regex: regex } }],
      },
    });
  }

  if (sortQuery) {
    dishAggregates.push(sortQuery);
  }

  Promise.all([
    RestaurantLocation.aggregate(restAggregates),

    Dish.aggregate(dishAggregates),
    // .populate({
    //   path: 'restaurant_id',
    // })
    // .populate({ path: 'tags' })
    // .populate({ path: 'images', select: 'name path' })
    // .where(tagQuery)
    // .where(priceRangeQuery)
    // .where({ $or: [{ name: { $regex: regex } }, { description: { $regex: regex } }] })
    // .sort(sortQuery),
    Tag.find(),
  ])
    .then(result => {
      result[0] = result[0].filter(rec => {
        return rec.restaurant_id != null;
      });
      result[1] = result[1].filter(rec => {
        return rec.restaurant_id != null;
      });
      let tempDishes = [];
      result[1].map(rec => {
        let tempData = {
          menuCategories: rec.menuCategories,
          popular_name: rec.popular_name,
          tags: rec.tags,
          images: rec.images,
          _id: rec._id,
          name: rec.name,
          restaurant_id: rec.restaurant_id,
          menus: rec.menus,
          description: rec.description,
          price: rec.price,
          currency: rec.currency,
          calories: rec.calories,
          slug: rec.slug,
          avgValueForMoneyRatings: rec.totalValueForMoneyRatings / rec.totalReviews,
          avgTasteRatings: rec.totalTasteRatings / rec.totalReviews,
          avgLookAndFeelRatings: rec.totalLookAndFeelRatings / rec.totalReviews,
          avgRatings: rec.totalRatings / rec.totalReviews,
          totalValueForMoneyRatings: rec.totalValueForMoneyRatings,
          totalTasteRatings: rec.totalTasteRatings,
          totalLookAndFeelRatings: rec.totalLookAndFeelRatings,
          totalRatings: rec.totalRatings,
          reviews: rec.reviews ? rec.reviews : [],
        };
        tempDishes.push(tempData);
      });
      if (result[0].length + tempDishes.length === 0) {
        let similarAggregate = [];
        let similarPipeline = [];
        let similarDistanceCal = null;
        if (hasLocation) {
          similarDistanceCal = {
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [parseFloat(filters.location.lng), parseFloat(filters.location.lat)],
              },
              distanceField: 'distance',
              spherical: true,
            },
          };
          similarAggregate.push(similarDistanceCal);
        }
        similarAggregate.push({
          $lookup: {
            from: 'restaurants',
            localField: 'restaurant_id',
            foreignField: '_id',
            as: 'restaurant_id',
          },
        });

        similarAggregate.push({
          $unwind: { path: '$restaurant_id' },
        });
        similarPipeline.push(
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$restaurant_id', '$$rest_id'],
                  },
                ],
              },
            },
          },
          {
            $group: {
              _id: '$restaurant_id',
              totalReviews: { $sum: '$totalReviews' },
            },
          }
          //{ $sort: { totalReviews: -1 } }
        );

        similarAggregate.push({
          $lookup: {
            from: 'images',
            localField: 'restaurant_id.images',
            foreignField: '_id',
            as: 'restaurant_id.images',
          },
        });
        similarAggregate.push({
          $lookup: {
            from: 'dishes',
            let: { rest_id: '$restaurant_id._id' },
            pipeline: similarPipeline,
            as: 'dishes',
          },
        });

        similarAggregate.push({
          $unwind: { path: '$dishes' },
        });
        similarAggregate.push({
          $sort: { 'dishes.totalReviews': -1 },
        });
        similarAggregate.push({
          $limit: 5,
        });
        RestaurantLocation.aggregate(similarAggregate)
          // .populate({
          //   path: 'restaurant_id',
          // })
          // .populate({ path: 'tags' })
          // .limit(5)
          .then(response => {
            res.json(resultOk({ similarRestaurants: response }, 'Founded restaurants'));
          })
          .catch(err => {
            next(err);
          });
      } else {
        let restaurants = [];
        let dishes = [];
        if (searchBy.toLowerCase() === 'restaurants' || searchBy.toLowerCase() === 'everywhere') {
          restaurants = result[0];
        }
        if (searchBy.toLowerCase() === 'dishes' || searchBy.toLowerCase() === 'everywhere') {
          dishes = tempDishes;
        }
        res.json(
          resultOk(
            {
              restaurants,
              dishes,
              similarRestaurants: [],
              systemTags: result[2],
            },
            'Founded restaurants and dishes'
          )
        );
      }
    })
    .catch(err => {
      next(err);
    });
});

router.get('/:slug', getToken, async function(req, res, next) {
  const slug = req.params.slug;
  const forPage = req.query.forPage;
  const aggregate = [];
  const dishPipeline = [];
  const userId = req.user ? req.user.user_id : null;
  try {
    dishPipeline.push({
      $match: {
        $expr: {
          $and: [
            {
              $eq: ['$restaurant_id', '$$rest_id'],
            },
          ],
        },
      },
    });
    dishPipeline.push({
      $project: {
        name: 1,
        description: 1,
        price: 1,
        totalReviews: 1,
        images: 1,
        menuCategories: 1,
        slug: 1,
        tags: 1,
        'restaurant_id.name': '$$rest_name',
        avgRatings: {
          $cond: {
            if: { $gt: ['$totalRatings', 0] },
            then: {
              $divide: ['$totalRatings', '$totalReviews'],
            },
            else: 0,
          },
        },
        avgValueForMoneyRatings: {
          $cond: {
            if: { $gt: ['$totalValueForMoneyRatings', 0] },
            then: {
              $divide: ['$totalValueForMoneyRatings', '$totalReviews'],
            },
            else: 0,
          },
        },
        avgTasteRatings: {
          $cond: {
            if: { $gt: ['$totalTasteRatings', 0] },
            then: {
              $divide: ['$totalTasteRatings', '$totalReviews'],
            },
            else: 0,
          },
        },
        avgLookAndFeelRatings: {
          $cond: {
            if: { $gt: ['$totalLookAndFeelRatings', 0] },
            then: {
              $divide: ['$totalLookAndFeelRatings', '$totalReviews'],
            },
            else: 0,
          },
        },
      },
    });
    dishPipeline.push({
      $lookup: {
        from: 'images',
        localField: 'images',
        foreignField: '_id',
        as: 'images',
      },
    });
    dishPipeline.push({
      $lookup: {
        from: 'menucategories',
        localField: 'menuCategories',
        foreignField: '_id',
        as: 'menuCategories',
      },
    });
    dishPipeline.push({
      $lookup: {
        from: 'tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tags',
      },
    });
    if (userId) {
      dishPipeline.push({
        $lookup: {
          from: 'reviews',
          let: { dish_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$typeId', '$$dish_id'],
                    },
                    {
                      $eq: ['$userId', mongoose.Types.ObjectId(userId)],
                    },
                  ],
                },
              },
            },
          ],
          as: 'reviews',
        },
      });
    }

    if (forPage === 'details') {
      dishPipeline.push({
        $match: {
          totalReviews: { $gt: 0 },
        },
      });
      dishPipeline.push({
        $sort: {
          modifiedAt: -1,
        },
      });
      aggregate.push({
        $lookup: {
          from: 'restaurantlocations',
          localField: '_id',
          foreignField: 'restaurant_id',
          as: 'locations',
        },
      });
    } else {
      dishPipeline.push({
        $sort: {
          avgRatings: -1,
        },
      });
    }

    aggregate.push({
      $lookup: {
        from: 'dishes',
        let: { rest_id: '$_id', rest_name: '$name' },
        pipeline: dishPipeline,
        as: 'dishes',
      },
    });

    aggregate.push({
      $lookup: {
        from: 'images',
        localField: 'images',
        foreignField: '_id',
        as: 'images',
      },
    });

    aggregate.push({
      $lookup: {
        from: 'menus',
        let: { rest_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$restaurant_id', '$$rest_id'],
                  },
                ],
              },
            },
          },
          {
            $lookup: {
              from: 'menucategories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
        ],
        as: 'menus',
      },
    });

    aggregate.push({
      $match: {
        slug: slug,
      },
    });

    Restaurant.aggregate(aggregate)
      .then(result => {
        Tag.find()
          .then(systemTags => {
            result[0].systemTags = systemTags;
            res.json(resultOk({ ...result[0] }, 'restaurant details'));
          })
          .catch(err => {
            next(err);
          });
      })
      .catch(next);
  } catch (error) {
    next(error);
  }
});

router.get('/', async function(req, res, next) {
  // const perPage = req.query.offset || 3;
  // var page = req.query.page || 1;
  try {
    const list = await RestaurantLocation.find({}).populate({
      path: 'restaurant_id',
    });
    // .skip(perPage * page - perPage)
    // .limit(perPage);
    let result = {
      status: 'ok',
      data: list,
    };
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
