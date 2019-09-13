const express = require('express');

const router = express.Router();

const { get } = require('../config');
const { logger } = require('../logger');
const axios = require('axios');
const yaml = require('js-yaml');
const lodash = require('lodash');

function getJuiceShopVersionFromTag(tag) {
  switch (tag) {
    case undefined:
    case null:
      return 'master';
    case 'latest':
    case 'snapshot':
      return 'develop';
    default:
      return tag;
  }
}

const fetchChallenges = lodash.once(async () => {
  const version = getJuiceShopVersionFromTag(get('juiceShop.tag'));

  const { data: rawChallenges } = await axios.get(
    `https://raw.githubusercontent.com/bkimminich/juice-shop/${version}/data/static/challenges.yml`
  );

  return yaml.safeLoad(rawChallenges);
});

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function getChallenges(req, res) {
  logger.debug('Listing challenges');
  const challenges = await fetchChallenges();

  res.json({ challenges });
}

router.all('/challenges', getChallenges);
module.exports = router;
module.exports.getJuiceShopVersionFromTag = getJuiceShopVersionFromTag;
