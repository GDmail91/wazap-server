/********************
 * CLIPS PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var clips_model = require('../models/clips_model');
var contests_model = require('../models/contests_model');

var router = express.Router();

/* GET clips list */
router.get('/', function(req, res, next) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'start_id': req.query.start_id,
            'amount': parseInt(req.query.amount)
        };

        if(data.amount == undefined) data.amount = 3;

        // 찜 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function (callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function (back_data, callback) {
                // 찜 목록 가져옴
                data.users_id = back_data.users_id;
                clips_model.get_clips_list(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function (back_data, callback) {
                // 각 모집글 별로 정보 검색
                contests_model.get_contests_by_array(data, back_data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            }
        ], function (err, result) {
            // 찜 목록 출력
            if (err) return res.send(err);
            var dummy_data = {
                result: true,
                msg: "찜 목록 가져옴",
                data: result
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

/* POST clip on my page */
router.post('/:contest_id', function(req, res, next) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id
        };

        // 찜 등록 프로세스
        var async = require('async');
        async.waterfall([
            function (callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function (back_data, callback) {
                // DB에 찜 한 게시물 저장
                data.users_id = back_data.users_id;
                clips_model.set_clips(data, function(result) {
                    if (result.result) return callback(null);
                    else callback(result);
                });
            }
        ], function (err) {
            // 찜한 결과 출력
            if (err) return res.send(err);

            var dummy_data = {
                result : true,
                msg : "찜 했습니다."
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

/* DELETE pop on my page */
router.delete('/:contest_id', function(req, res, next) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id
        };

        // 찜 제거 프로세스
        var async = require('async');
        async.waterfall([
            function (callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function (back_data, callback) {
                // DB에 찜 한 게시물 삭제
                data.users_id = back_data.users_id;
                clips_model.delete_from_clips(data, function(result) {
                    if (result.result) return callback(null);
                    else callback(result);
                });
            }
        ], function (err) {
            // 찜 취소 결과 출력
            if (err) return res.send(err);

            var dummy_data = {
                result : true,
                msg : "찜 목록 삭제."
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

module.exports = router;
