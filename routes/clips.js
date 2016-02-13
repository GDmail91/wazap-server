/********************
 * CLIPS PAGE
 ********************/

var express = require('express');
var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit: 20,
    waitForConnections: false
});

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
            'amount': req.query.amount
        };

        if(data.amount == undefined) data.amount = 3;

        // 찜 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function (callback) {
                // 사용자 인증
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select = [data.access_token];
                    connection.query("SELECT users_id FROM Users WHERE kakao_access_token = ?", select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, {users_id: rows[0].users_id});
                        } else {
                            callback({result: false, msg: '잘못된 접근입니다.'});
                        }
                    });
                });
            },
            function (back_data, callback) {
                // 찜 목록 가져옴
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select = [back_data.users_id];
                    connection.query("SELECT cli_contests_id FROM Clips WHERE cli_users_id = ?", select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "찜 목록을 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, rows);
                        } else {
                            callback({result: false, msg: '찜 목록이 없습니다.'});
                        }
                    });
                });
            },
            function (back_data, callback) {
                // 각 모집글 별로 정보 검색
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
                    // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
                    var contests_list=  [];
                    if (data.start_id == undefined) {
                        contests_list = back_data;
                    }
                    else {
                        back_data.forEach(function (val, index) {
                            if (val.cli_contests_id <= data.start_id) {
                                contests_list[index] = { cli_contests_id: val.cli_contests_id };
                            }
                        });
                    }

                    var select = [data.amount];
                    var sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id IN (";

                    // contests id 갯수만큼 where절에 추가하기
                    var length = 0;
                    contests_list.forEach(function (val) {
                        if(length == 0) sql += val.cli_contests_id;
                        else sql += "," + val.cli_contests_id;
                        length ++;
                        if (length == contests_list.length) {
                            sql += ") ORDER BY postdate DESC LIMIT ?";

                            connection.query(sql, select, function (err, rows) {
                                if (err) {
                                    connection.release();
                                    return callback({ result: false, msg: "찜 목록 정보를 가져오는데 실패했습니다. 원인: "+err });
                                }
                                connection.release();

                                callback(null, rows);
                            });
                        }
                    });
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
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select = [data.access_token];
                    connection.query("SELECT users_id FROM Users WHERE kakao_access_token = ?", select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, {users_id: rows[0].users_id});
                        } else {
                            callback({result: false, msg: '잘못된 접근입니다.'});
                        }
                    });
                });
            },
            function (back_data, callback) {
                // DB에 찜 한 게시물 저장
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);

                    var insert = ['Clips',
                        back_data.users_id,
                        data.contest_id];
                    connection.query("INSERT INTO ?? SET " +
                        "`cli_users_id` = ?, " +
                        "`cli_contests_id` = ? ", insert, function (err) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }
                        connection.release();
                        callback(null);
                    });
                });
            }
        ], function (err, result) {
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
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select = [data.access_token];
                    connection.query("SELECT users_id FROM Users WHERE kakao_access_token = ?", select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, {users_id: rows[0].users_id});
                        } else {
                            callback({result: false, msg: '잘못된 접근입니다.'});
                        }
                    });
                });
            },
            function (back_data, callback) {
                // DB에 찜 한 게시물 삭제
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);

                    var select = ['Clips',
                        back_data.users_id,
                        data.contest_id];
                    connection.query("DELETE FROM ?? " +
                        "WHERE contests_id = ? ", select, function (err) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }
                        connection.release();
                        callback(null);
                    });
                });
            }
        ], function (err, result) {
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
