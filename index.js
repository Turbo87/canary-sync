var express = require('express');
var bodyParser = require('body-parser');
var request = require('request').defaults({
  baseUrl: 'https://api.github.com/',
  headers: {
    'User-Agent': 'canary-sync',
  },
  auth: {
    user: process.env.GH_USER,
    pass: process.env.GH_TOKEN,
  },
});

var app = express();
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
  res.send('canary-sync is running');
});

app.post('/', function(req, res) {
  var payload = req.body;

  var repoName = payload.repository && payload.repository.full_name;
  if (!repoName) {
    return res.json({ error: 'missing-repository' });
  }

  if (payload.ref !== 'refs/heads/master') {
    console.log(repoName + ': ignoring ref "' + payload.ref + '"');
    return res.json({ error: 'wrong-ref' });
  }

  console.log(repoName + ': reading "master" ...');
  request.get('/repos/' + repoName + '/git/refs/heads/master', { json: true }, function(error, response, body) {
    var sha = body.object.sha;

    console.log(repoName + ': updating "canary" to "' + sha + '" ...');
    request.patch('/repos/' + repoName + '/git/refs/heads/canary', {
      json: {
        sha: sha,
        force: true,
      },
    }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        error = error || body || response.statusCode;
        console.log(repoName + ': ' + (error.message || error));
        res.json({ error: error });
      } else {
        console.log(repoName + ': done');
        res.json({ status: response.statusCode });
      }
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
