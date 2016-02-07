var routes = require('./routes/index');
var users = require('./routes/users');
var contests = require('./routes/contests');
var clips = require('./routes/clips');
var alrams = require('./routes/alrams');

module.exports = function(app){
    app.use('/', routes);
    app.use('/users', users);
    app.use('/contests', contests);
    app.use('/clips', clips);
    app.use('/alrams', alrams);

};
