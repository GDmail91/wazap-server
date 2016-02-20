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
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 인증 코드가 있는지 확인
            if (data.authorize_code) {
                callback(null);
            } else {
                callback({result: false, msg: '잘못된 접근입니다.'});
            }
        },
        function(callback) {
            // kakao 에 사용자 토큰 요청
            var req_data = {
                'grant_type': 'authorization_code',
                'client_id': credentials.kakao_rest_key, // app_key on kakao web
                'redirect_uri': credentials.domain_server + '/kakao_oauth',
                'code': data.authorize_code
            };
            request.post({
                url: 'https://kauth.kakao.com/oauth/token',
                form: req_data
            }, function (err, httpResponse, body) {
                console.log('사용자 토큰 생성: '+body);
                var body = JSON.parse(body);
                if (body.error) return callback({result: false, msg: body.error_description});
                callback(null, req_data.code, body);
            });

        },
        function(code, back_data, callback) {
            // kakao 에 사용자 정보 요청
            request.get({
                url: 'https://kapi.kakao.com/v1/user/me',
                headers: {
                    'Authorization': 'Bearer ' + back_data.access_token
                }
            }, function (err, httpResponse, body) {
                console.log('사용자 정보 요청: '+body);
                var body = JSON.parse(body);
                if (body.error) return callback({result: false, msg: body.error_description});
                back_data.user_id = body.id;
                back_data.properties = body.properties;
                callback(null, back_data);
            });

        },
        function(back_data, callback) {
            // DB에 사용자 데이터 저장
            if (back_data.properties) {
                pool.getConnection(function (err, connection) {
                    var insert = ['Users',
                        back_data.access_token,
                        back_data.token_type,
                        back_data.refresh_token,
                        back_data.expires_in,
                        back_data.scope,
                        back_data.user_id,
                        back_data.properties.nickname,
                        encodeURIComponent(back_data.properties.profile_image),
                        encodeURIComponent(back_data.properties.thumbnail_image)];
                    console.log(insert);
                    var query = connection.query('INSERT INTO ?? SET ' +
                        'kakao_access_token = ?, ' +
                        'kakao_token_type = ?, ' +
                        'kakao_refresh_token = ?, ' +
                        'kakao_expires_in = ?, ' +
                        'kakao_scope = ?, ' +
                        'users_id = ?, ' +
                        'username = ?, ' +
                        'profile_img = ?, ' +
                        'thumb_img = ?', insert, function (err, rows) {
                        if (err) {
                            connection.release();
                            return callback(err);
                        }
                        connection.release();
                        callback(null, back_data);
                    });
                });
            } else {
                callback({result: false, msg: '처리중 오류가 발생했습니다.'});
            }
        },
        function(back_data, callback) {
            // 로그인 처리
            var req_data = { access_token : back_data.access_token};
            request.post({
                url: '/users/auth',
                form: req_data
            }, function (err, httpResponse, body) {
                var body = JSON.parse(body);
                if (body.result) {
                    callback(null, req_data);
                } else {
                    // 에러 처리
                    callback(body);
                }
            });
        }
    ],
    function(err, results) {
        console.log(err);
        if (err) return res.send(err);
        // 처리 완료후 사용자 토큰 반환
        var dummy_data = {
            result: true,
            msg: "로그인에 성공했습니다.",
            data: results.access_token
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* POST get users information from kakao */
router.post('/users', function(req, res, next) {
    var data = {
        "access_token": req.body.access_token,
        "users_id": req.body.users_id,
        "username": req.body.username,
        "profile_image": req.body.profile_image,
        "thumbnail_image": req.body.profile_image
    };

    pool.getConnection(function (err, connection) {
        var insert = ['Users',
            data.access_token,
            data.users_id,
            data.username,
            encodeURIComponent(data.profile_image),
            encodeURIComponent(data.thumbnail_image),
            data.access_token,
            data.username,
            encodeURIComponent(data.profile_image),
            encodeURIComponent(data.thumbnail_image)];
        console.log(insert);
        connection.query('INSERT INTO ?? SET ' +
            'facebook_access_token = ?, ' +
            'users_id = ?, ' +
            'username = ?, ' +
            'profile_img = ?, ' +
            'thumb_img = ? ' +
            'ON DUPLICATE KEY UPDATE ' +
            'facebook_access_token = ?, ' +
            'username = ?, ' +
            'profile_img = ?, ' +
            'thumb_img = ? ', insert, function (err, rows) {
            var dummy_data;

            if (err) {
                dummy_data = {
                    result: false,
                    msg: "데이터베이스 저장 실패. 원인: "+ err
                };
            } else {
                dummy_data = {
                    result: true,
                    msg: "사용자 등록 완료"
                };
            }
            connection.release();

            res.statusCode = 200;
            res.send(dummy_data);
        });
    });
});


module.exports = router;
