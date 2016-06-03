var Twitter = require('twitter');
var accounts = require('../playground/accounts');

var rand = accounts[Math.floor(Math.random() * accounts.length)];

var client = new Twitter({
  consumer_key: rand.consumer_key,
  consumer_secret: rand.consumer_key_secret,
  access_token_key: rand.access_token_key,
  access_token_secret: rand.access_token_secret
});

var target = 'mannynotfound';
var names = [
  'Kanye West',
  'Sol Lewitt',
  'Bruce Lee',
  'Neil DeGrasse Tyson',
  'Martin Luther King',
  'Eddie Murphy',
  'Captain Planet',
  'Raiden',
  'Subzero',
  'Goku',
  'Lil Uzi Vert',
  'Lil Yachty',
  'Kodak Black',
  'Rick Ross',
  'Meek Mill',
  'Drake'
];

client.get('statuses/user_timeline', {screen_name: target, count: 200}, function(err, resp) {
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

      client.post(randAct.action, {id: tweet.id_str}, function(err, resp) {
        if (err) {
          console.log(err)
        } else {
          console.log(randAct.action === 'favorites/create' ? 'LIKED ' : 'RETWEETED ', tweet.id_str);
          randAct.id_str = tweet.id_str;
          todoUndo.push(randAct);
          if (!timeout) {
            var randName = names[Math.floor(Math.random() * names.length)];
            client.post('account/update_profile', {name: randName}, function(err, resp) {
              if (err) {
                console.log(err);
              } else {
                console.log('CHANGED NAME TO ', randName);
                engageLoop();
              }
            })
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
    client.get(next.undo, {id: next.id_str}, function(err, resp) {
      if (err) {
        console.log(err);
      } else {
        console.log('CLEANED UP TWEET ', next.id_str);
        cleanUp(tweets);
      }
    });
  }, 1000 + Math.floor(Math.random() * 4000));
}

