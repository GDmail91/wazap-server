/********************
 * WEEKLY LIST PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var weekly_list_model = require('../models/weekly_list_model');

var router = express.Router();

/* GET clips list */
router.get('/', function(req, res, next) {
    if(req.query.amount == undefined) req.query.amount = 3;
    var data = {
        'access_token': req.headers['access-token'],
        'start_id': req.query.start_id,
        'amount': parseInt(req.query.amount)
    };

    // 주간 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function (callback) {
            if (typeof data.access_token == 'undefined') return callback(null);
            // 사용자 인증
            users_model.get_user_id(data, function(result) {
                if (result.result) {
                    data.users_id = result.data.users_id;
                    return callback(null);
                }
                else callback(result);
            });
        },
        function (callback) {
            // 주간 목록 가져옴
            weekly_list_model.get_weekly_list(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        }
    ], function (err, result) {
        // 주간 목록 출력
        if (err) return res.send(err);
        var dummy_data = {
            result: true,
            msg: "주간 목록 가져옴",
            data: result
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

module.exports = router;
