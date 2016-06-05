var Twitter = require('twitter');
var accounts = require('../playground/accounts');

var availableClients = JSON.parse(JSON.stringify(accounts));
var usedClients = [];
// pocket holds the last one used in an array and waits for a second call before
// adding itself back in, thus avoiding the chance of being the last one and then
// being the first one in the new reset (twice in a row)
var pocket = [];

function getClient() {
  var num = Math.floor(Math.random() * availableClients.length);
  var next = availableClients.splice(num, 1)[0];

  if (!availableClients.length) {
    availableClients = usedClients.splice(0, usedClients.length);
    pocket.push(next);
  } else {
    usedClients.push(next);
    if (pocket.length) {
      var pock = pocket.splice(0, 1)[0];
      availableClients.splice(
        Math.floor(Math.random() * availableClients.length), 0, pock
      )
    }
  }

  console.log('USING ', next['Full name']);

  return new Twitter({
    consumer_key: next.consumer_key,
    consumer_secret: next.consumer_key_secret,
    access_token_key: next.access_token_key,
    access_token_secret: next.access_token_secret
  });
}

var target = 'mannynotfound';

getClient().get('statuses/user_timeline', {screen_name: target, count: 200}, function(err, resp) {
  if (err) {
    console.log(err);
  } else {
    console.log('GOT TIMELINE, ENGAGING!')
    engage(resp);
  }
});

function getRandomAction() {
  var actions = [
    {
      'action': 'statuses/retweet',
      'undo': 'statuses/unretweet'
    },
    {
      'action': 'favorites/create',
      'undo': 'favorites/destroy'
    }
  ];

  return actions[Math.floor(Math.random() * actions.length)];
}

function engage(tweets) {
  var engager;
  var todoUndo = [];
  var timeout = false;

  function engageLoop() {
    setTimeout(function() {
      var randIdx = Math.floor(Math.random() * tweets.length);
      var tweet = tweets.splice(randIdx, 1)[0];
      var randAct = getRandomAction();
      var client = getClient();

      client.post(randAct.action, {id: tweet.id_str}, function(err, resp) {
        if (err) {
          console.log(err)
        } else {
          console.log(randAct.action === 'favorites/create' ? 'LIKED ' : 'RETWEETED ', tweet.id_str);
          randAct.id_str = tweet.id_str;
          randAct.client = client;
          todoUndo.push(randAct);
          if (!timeout) {
            engageLoop();
          } else {
            cleanUp(todoUndo);
          }
        }
      });
    }, 1000 + Math.floor(Math.random() * 10000));
  }

  engageLoop();
  setTimeout(function() {
    timeout = true;
  }, 1000 * 60);
}

function cleanUp(tweets) {
  setTimeout(function() {
    var next = tweets.splice(0, 1)[0];
    next.client.get(next.undo, {id: next.id_str}, function(err, resp) {
      if (err) {
        console.log(err);
      } else {
        console.log('CLEANED UP TWEET ', next.id_str);
        cleanUp(tweets);
      }
    });
  }, 1000 + Math.floor(Math.random() * 4000));
}

