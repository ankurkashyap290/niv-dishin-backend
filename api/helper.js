const resultOk = function(data, msg) {
  return { status: 'ok', data, msg };
};
const resultError = function(data, msg) {
  return { status: 'error', data, msg };
};

const filterPriceCond = filterPrice => {
  let query = null;
  if (filterPrice.indexOf('-') != -1) {
    const filterRange = filterPrice.split('-');
    query = {
      $gte: parseFloat(filterRange[0]),
      $lte: parseFloat(filterRange[1]),
    };
  } else if (filterPrice.indexOf('>') != -1) {
    const priceGtr = filterPrice.split('>');
    query = {
      $gte: parseFloat(priceGtr[1]),
    };
  }
  if (query) {
    query = { price: query };
  }
  return query;
};

const getMetersOfUnit = (value, unit) => {
  const metersPerMinute = 85;
  let meters = 0;
  if (unit === 'hour') {
    meters = value * 60 * metersPerMinute;
  } else if (unit === 'min') {
    meters = value * metersPerMinute;
  } else if (unit === 'km') {
    meters = value * 1000;
  }
  return meters;
};

const distanceToMeCond = dtm => {
  let query = null;
  let dtmArr = dtm.split('-');
  let unit = dtmArr[dtmArr.length - 1];
  let maxDistanceMeters = null;
  let minDistanceMeters = null;
  if (dtmArr[0].indexOf('>') != -1) {
    let tmpArr = dtmArr[0].split('>');
    maxDistanceMeters = getMetersOfUnit(tmpArr[1], unit);
  } else if (dtmArr[0].indexOf('<') != -1) {
    let tmpArr = dtmArr[0].split('<');
    minDistanceMeters = getMetersOfUnit(tmpArr[1], unit);
  } else {
    minDistanceMeters = getMetersOfUnit(dtmArr[0], unit);
    maxDistanceMeters = getMetersOfUnit(dtmArr[1], unit);
  }

  // query = {
  //   loc: {
  //     $near: {
  //       $geometry: {
  //         type: 'Point',
  //         coordinates: [lng, lat],
  //       },
  //       $maxDistance: 1000//maxDistanceMeters,
  //       // $minDistance: minDistanceMeters,
  //     },
  //   },
  // };

  // console.log('query', query);

  query = { minDistance: minDistanceMeters, maxDistance: maxDistanceMeters };
  console.log('distance to me min,max', query);
  return query;
};

module.exports = { resultOk, resultError, filterPriceCond, distanceToMeCond };
