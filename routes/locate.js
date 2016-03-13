/********************
 * LOCATE PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var locate_model = require('../models/locate_model');

var router = express.Router();

/* GET state name */
router.get('/', function(req, res) {
    if (!req.headers['access-token']) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'access_token': req.headers['access-token']
    };

    // 사용자 블럭 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 사용자 인증
            users_model.get_user_id(data, function(result) {
                if (result.result) {
                    data.users_id = result.data.users_id;
                    return callback(null);
                }
                else callback(result);
            });
        },
        function(callback) {
            // 시,구 정보 가져옴
            locate_model.get_state_list(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 시,구 정보 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: result.msg,
            data: result.data
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* GET city name */
router.get('/:state_name', function(req, res) {
    if (!req.headers['access-token']) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'access_token': req.headers['access-token'],
        'state_name': req.params.state_name
    };

    // 사용자 블럭 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 사용자 인증
            users_model.get_user_id(data, function(result) {
                if (result.result) {
                    data.users_id = result.data.users_id;
                    return callback(null);
                }
                else callback(result);
            });
        },
        function(callback) {
            // 구, 군 정보 가져옴
            locate_model.get_city_list(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 구, 군 정보 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: result.msg,
            data: result.data
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

module.exports = router;
