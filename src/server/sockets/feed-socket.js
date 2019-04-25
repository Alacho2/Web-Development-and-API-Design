const WebSocket = require('ws');

const postRepo = require('../db/postRepo.js');

const app = (app) => {
  const ews = require('express-ws')(app);
  const clients = ews.getWss().clients;

  app.ws('/feed', function (ws, req) {
    //console.log(req._parsedUrl.query);
    const username = decodeURIComponent(req.query.id);
    console.log(`Houston, we have a connection. ${clients.size} connected`);
    /*
      På profilen må vi filtrere på brukerens poster. Der får vi profile i req, så vi kan bruke den.
      På feed må vi filtrere på brukerens venner og brukerens egne poster. Hent de og legg de til.
     */

    let posts = [];

    const friendsPost = postRepo.getFriendsPost(username);
    const ownPost = postRepo.getUsersOwnPost(username);

    posts = posts.concat(friendsPost);
    posts = posts.concat(ownPost);

    console.log(posts);

    ws.send(JSON.stringify({posts: posts.reverse(), noClients: clients}));

    ws.on('message', fromClient => {
      const dto = JSON.parse(fromClient);

      if(dto.text !== "" && dto.author !== null){
        postRepo.createPost(dto.author, dto.text);

        const postLength = postRepo.getAllPosts().length-1;
        const post = postRepo.getAllPosts()[postLength];
        distributeSomething([post])
      }
    });

    ws.on('close', () => {
      console.log(`Houston, we lost a connection. ${clients.size} connected`);
    });

    /*ws.send(JSON.stringify({messages: messages, noClient: clients.size}));

    distributeSomething([]);

    ws.on('message', fromClient => {

      const dto = JSON.parse(fromClient);
      const id = counter++;
      const msg = {id: id, author: dto.author, text: dto.text};

      messages.push(msg);

      distributeSomething([msg])
    });

    ws.on('close', () => {
      distributeSomething([]);
      console.log(`Houston, we lost a connection. ${clients.size} connected`);
    });
  });
*/
  });

  const distributeSomething = (msg) => {
    clients.forEach(client => {
      console.log(client.readyState);
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          posts: msg,
          noClient: clients.size
        }));
      }
    })
  };
};

module.exports = app;