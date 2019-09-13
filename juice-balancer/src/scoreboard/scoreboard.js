const express = require('express');

const router = express.Router();

const yaml = require('js-yaml');
const lodash = require('lodash');
const redis = require('../redis');
const Hashids = require('hashids');

const { get } = require('../config');
const { logger } = require('../logger');
const axios = require('axios');

const hashids = new Hashids(
  'this is my salt',
  60,
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
);

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

const fetchProgress = lodash.throttle(async () => {
  const teams = await redis.lrange('teams', 0, -1);

  const challenges = await fetchChallenges();

  const fetchingPromises = teams.map(async team => {
    const code = await redis.get(`t-${team}-continue-code`);

    logger.info(`Fetched continue code for team ${team}: ${code} (${`t-${team}-continue-code`})`);

    const solvedChallenges = hashids.decode(code) || [];

    const score = solvedChallenges
      .map(id => challenges[id].difficulty)
      .reduce((sum, difficulty) => {
        return sum + difficulty * 10;
      }, 0);

    return {
      team: team,
      solvedChallenges,
      score,
    };
  });

  return await Promise.all(fetchingPromises);
}, 1000);

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function getProgress(req, res) {
  return res.json({ teams: await fetchProgress() });
}

router.get('/challenges', getChallenges);
router.get('/progress', getProgress);
router.get('/reset', async (req, res) => {
  await redis.del('teams');

  res.status(200).send('Reset Team List');
});

module.exports = router;
module.exports.getJuiceShopVersionFromTag = getJuiceShopVersionFromTag;
