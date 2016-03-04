/********************
 * SEARCH PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var contests_model = require('../models/contests_model');

var router = express.Router();

/* GET search for title */
router.get('/', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        if (req.query.amount == undefined) req.query.amount = 3;
        var data = {
            'start_id': req.query.start_id,
            'amount': req.query.amount,
            'search': req.query.search,
            'access_token': req.query.access_token
        };

        // 지원서 마감하는 프로세스
        var async = require('async');
        async.waterfall([
                function (callback) {
                    // Validation (search 목록만 있는지)
                    var validation = /[a-힣]/;
                    if (data.search == undefined) return callback({result: false, msg: '검색명이 없습니다.'});
                    if (!validation.test(data.search)) return callback({result: false, msg: '문자로만 검색해 주세요'});
                    data.search = '%' + data.search + '%';
                    callback(null);
                },
                function (callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function (result) {
                        if (result.result) {
                            data.users_id = result.data.users_id;
                            return callback(null);
                        }
                        else callback(result);
                    });
                },
                function (callback) {
                    // 타이틀로 게시물 검색
                    contests_model.get_contests_by_title(data, function (result) {
                        if (result.result) return callback(null, result);
                        else callback(result);
                    });
                }],
            function (err, result) {
                // 검색 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: result.msg,
                    data: result.data
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

module.exports = router;