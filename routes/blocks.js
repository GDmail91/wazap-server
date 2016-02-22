/********************
 * BLOCKS PAGE
 ********************/

var express = require('express');
var users_model = require('../models/users_model');
var blocks_model = require('../models/blocks_model');

var router = express.Router();

/* GET user block list */
router.get('/users', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'access_token': req.query.access_token,
        'start_id': parseInt(req.query.start_id),
        'amount': parseInt(req.query.amount)
    };

    if(data.amount == undefined) data.amount = 10;

    // 사용자 블럭 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 사용자 블럭 리스트 가져옴
            blocks_model.get_users_status(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 사용자 블럭 목록 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: "사용자 블럭 목록 가져옴",
            data: result
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* GET contest block list */
router.get('/contests', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'access_token': req.query.access_token,
        'start_id': req.query.start_id,
        'amount': req.query.amount
    };

    if(data.amount == undefined) data.amount = 10;

    // 게시물 블럭 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 게시물 블럭 리스트 가져옴
            blocks_model.get_contests_status(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 게시물 블럭 목록 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: "게시글 블럭 목록 가져옴",
            data: result
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* POST user block */
router.post('/users', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'access_token': req.query.access_token,
        'users_id': req.body.users_id
    };

    // 사용자 블럭 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 사용자 블럭
            blocks_model.set_user_block(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 사용자 블럭 결과 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: result.msg
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* POST contest block */
router.post('/contests', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'access_token': req.query.access_token,
        'contests_id': req.body.contests_id
    };

    // 게시물 블럭 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 게시물 블럭
            blocks_model.set_contest_block(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 게시물 블럭 결과 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: result.msg
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* DELETE user block status */
router.delete('/users', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }
    var data = {
        'access_token': req.query.access_token,
        'users_id': req.body.users_id
    };

    // 사용자 블럭 취소 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 사용자 블럭 취소
            blocks_model.set_user_normal(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 사용자 블럭 취소 결과 출력
        if (err) return res.send(err);

        var dummy_data = {
            result: true,
            msg: result.msg
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });
});

/* DELETE contest block */
router.delete('/contests', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    }

    var data = {
        'access_token': req.query.access_token,
        'contests_id': req.body.contests_id
    };

    // 게시물 블럭 취소 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 관리자 인증
            users_model.get_admin_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            // 게시물 블럭 취소
            blocks_model.set_contest_normal(data, function(result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }
    ], function(err, result) {
        // 게시물 블럭 취소 결과 출력
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
