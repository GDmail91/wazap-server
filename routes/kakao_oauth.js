/********************
 * KAKAO_OAUTH PAGE
 ********************/

var express = require('express');
var request = require('request');
var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit:20,
    waitForConnections:false
});

var router = express.Router();

/* GET redirect from kakaotalk oauth */
router.get('/', function(req, res, next) {
    var data = {
        'authorize_code': req.query.code
    };

    if (data.authorize_code) {
        var req_data = {
            'grant_type': 'authorization_code',
            'client_id': '0a02b5ed836ae2f73a4d8bcb89a0aca1', // TODO app_key need
            'redirect_uri': credentials.api_server + '/kakao_oauth/get_user',
            'code': data.authorize_code
        };
        request.get({
            url: 'https://kauth.kakao.com/oauth/token',
            form: req_data,
        }, function (err, httpResponse, body) {
            var body = JSON.parse(body);

            if (body.error) return res.send('잘못된 접근입니다.');

            var data = {
                "access_token": body.access_token,
                "token_type": body.token_type,
                "refresh_token": body.refresh_token,
                "expires_in": body.expires_in,
                "scope": body.scope
            };

            // TODO DB에 사용자 데이터 저장
            pool.getConnection(function (err, connection) {
                var insert = ['users', data.access_token, data.token_type, data.refresh_token, data.expires_in, data.scope];
                var query = connection.query('INSERT INTO ?? SET kakao_access_token = ??, kakao_token_type = ??, kakao_refresh_token = ??, kakao_expires_in = ??, kakao_scope = ??', insert, function (err, rows) {
                    if (err) {
                        connection.release();
                        throw err;
                    }

                    console.log(rows);
                    connection.release();

                    var req_data = { access_token : data.access_token};
                    request.post({
                        url: '/users/login',
                        form: req_data,
                    }, function (err, httpResponse, body) {
                        var body = JSON.parse(body);
                        if (body.result) {
                            res.redirect(credentials.api_server + '/contests');
                        } else {
                            res.send(body);
                        }
                    });
                });
            });
        });

    } else {
        res.send('잘못된 접근입니다.');
    }
});
/*

/!* POST get users information from kakao *!/
router.post('/get_user', function(req, res, next) {
    var data = {
        "access_token": req.body.access_token,
        "token_type": req.body.token_type,
        "refresh_token": req.body.refresh_token,
        "expires_in": req.body.expires_in,
        "scope": req.body.scope
    };

    // TODO DB에 사용자 데이터 저장

    res.header(200);
    res.send(dummy_data);
});
*/


module.exports = router;
