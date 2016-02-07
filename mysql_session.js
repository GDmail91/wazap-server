//redis session require
var session = require('express-session');
var redis = require('redis');
var redisStore = require('connect-redis')(session);
var client = redis.createClient();

module.exports = function(app) {
    app.use(session(
        {
            secret: 'secret_key',
            store: new redisStore({
                host: "127.0.0.1",
                port: 6379,
                client: client,
                prefix : "session:",
                db : 0
            }),
            saveUninitialized: false, // don't create session until something stored,
            resave: true // don't save session if unmodified
        }
    ));

    //....아래쪽...

    //redis session input output
    var router = express.Router();
    router.get('/session/set/:value', function(req, res) {
        req.session.redSession = req.params.value;
        res.send('session written in Redis successfully');
    });

    app.get('/session/get/', function(req, res) {
        if(req.session.redSession)
            res.send('the session value stored in Redis is: ' + req.session.redSess);
        else
            res.send("no session value stored in Redis ");
    });
};