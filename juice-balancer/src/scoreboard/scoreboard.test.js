jest.mock('../redis');
jest.mock('../kubernetes');
jest.mock('http-proxy');

const request = require('supertest');
const app = require('../app');

const { getJuiceShopVersionFromTag } = require('./scoreboard');

describe('docker tag to git tag / branch conversion', () => {
  test.each([
    ['v9.0.1', 'v9.0.1'],
    ['snapshot', 'develop'],
    ['latest', 'develop'],
    [null, 'master'],
    [undefined, 'master'],
  ])('docker tag "%s" should convert to git reference: %p', async (dockerTag, gitReference) => {
    expect(getJuiceShopVersionFromTag(dockerTag)).toBe(gitReference);
  });
});

test('challenge endpoint returns challenges', async () => {
  await request(app)
    .get('/balancer/scoreboard/challenges')
    .expect(200)
    .then(({ body }) => {
      expect(body.challenges).toBeDefined();

      const challenges = body.challenges;

      expect(challenges).toEqual(
        expect.arrayContaining([
          {
            name: 'Error Handling',
            category: 'Security Misconfiguration',
            description:
              'Provoke an error that is neither very gracefully nor consistently handled.',
            difficulty: 1,
            hint:
              'Try to submit bad input to forms. Alternatively tamper with URL paths or parameters.',
            hintUrl:
              'https://bkimminich.gitbooks.io/pwning-owasp-juice-shop/part2/security-misconfiguration.html#provoke-an-error-that-is-neither-very-gracefully-nor-consistently-handled',
            key: 'errorHandlingChallenge',
          },
        ])
      );
    });
});
