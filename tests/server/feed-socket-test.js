const request = require('supertest');
const {app} = require('../../src/server/app');
const WS = require('ws');

const {asyncCheckCondition, checkConnectedWS} = require('../mytest-util.js');

let server;
let port;

describe("WebSocket Handling",  () => {
  beforeAll(done => {
    server = app.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll(() => {
    server.close();
  });

  const sockets = [];

  afterEach(() => {
    /*
        make sure to manually free the sockets, otherwise might block Jest and the
        shutting down of Express...
    */
    for (let i = 0; i < sockets.length; i++) {
      console.log("Closing socket: " + i);
      sockets[i].close();
    }
    sockets.length = 0;
  });

  it("Should accept a connection to feed", async () => {
    const first = new WS(`ws://localhost:${port}/feed?id=Chef`);
    sockets.push(first);
    let connected = await checkConnectedWS(first, 2000);
    expect(connected).toBe(true);
  });

});
