var routes = require('./routes/index');
var users = require('./routes/users');
var contests = require('./routes/contests');
var clips = require('./routes/clips');
var alrams = require('./routes/alrams');
var search = require('./routes/search');
var kakao_oauth = require('./routes/kakao_oauth');

module.exports = function(app){
    app.use('/', routes);
    app.use('/users', users);
    app.use('/contests', contests);
    app.use('/clips', clips);
    app.use('/alrams', alrams);
    app.use('/search', search);
    app.use('/kakao_oauth', kakao_oauth);

};
