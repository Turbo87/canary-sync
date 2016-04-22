var express = require('express');
var bodyParser = require('body-parser');

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

  var sha1 = payload.after;
  console.log(repoName + ': updating "canary" to "' + sha1 + '" ...');
  return res.json({ status: 'ok' });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
