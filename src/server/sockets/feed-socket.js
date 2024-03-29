const WebSocket = require('ws');

const {orderBy} = require('lodash');

const postRepo = require('../db/postRepo.js');

const app = (app) => {
  const ews = require('express-ws')(app);
  const clients = ews.getWss().clients;

  app.ws('/feed', function (ws, req) {
    const username = req.query.id;
    const profile = decodeURIComponent(req.query.profile);

    let where;
    let posts = [];

    if(username !== "null" && username !== undefined){
      where = "feed";
    } else {
      where = profile
    }

    if(profile !== "undefined" && profile !== undefined){
      console.log(`Houston, we have a connection to ${where}. ${clients.size} connected`);

      const ownPosts = postRepo.getUsersOwnPost(profile);

      ws.send(JSON.stringify({posts: ownPosts.reverse()}));

      ws.on('message', fromClient => {
        const dto = JSON.parse(fromClient);

        if(dto.text !== "" && dto.author !== null){
          postRepo.createPost(dto.author, dto.text);
          const postLength = postRepo.getUsersOwnPost(dto.author).length - 1;
          const post = postRepo.getUsersOwnPost(dto.author)[postLength];
          distributeSomething([post]);
        }
      })

      ws.on('close', () => {
        console.log(`Houston, we lost a connection. ${clients.size} connected`);
      });
    }

    if (username !== "null" && username !== undefined) {
      console.log(`Houston, we have a connection to ${where}. ${clients.size} connected`);

      const friendsPost = postRepo.getFriendsPost(username);
      const ownPost = postRepo.getUsersOwnPost(username);

      posts = posts.concat(friendsPost);
      posts = posts.concat(ownPost);

      //console.log(posts.sort());

      posts = orderBy(posts, ['id'], ['desc']);

      ws.send(JSON.stringify({posts: posts, noClients: clients}));

      ws.on('message', fromClient => {
        const dto = JSON.parse(fromClient);

        if (dto.text !== "" && dto.author !== null) {
          postRepo.createPost(dto.author, dto.text);

          const postLength = postRepo.getAllPosts().length - 1;
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
    }
  });

  const distributeSomething = (msg) => {
    clients.forEach(client => {
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