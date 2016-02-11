/********************
 * CONTESTS PAGE
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

/* GET contests list */
router.get('/', function(req, res) {
    var data = {
        'start_id': req.query.start_id,
        'amount': req.query.amount
    };
    console.log(data.amount);
    if(data.amount == undefined) data.amount = 3;

    // TODO 모집공고 목록 가져옴 (메인)
    if(data.start_id == undefined) {
        pool.getConnection(function (err, connection) {
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var select = [data.amount];
            connection.query("SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return res.send({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "모집글 목록 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "모집글 정보가 없습니다."
                    };
                }
                res.statusCode = 200;
                res.send(dummy_data);
            });
        });
    } else {
        pool.getConnection(function (err, connection) {
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var select = [data.start_id, data.amount];
            connection.query("SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id < ? ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return res.send({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();
                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "모집글 목록 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "모집글 정보가 없습니다."
                    };
                }
                res.statusCode = 200;
                res.send(dummy_data);
            });
        });
    }
});

/* POST contest writing */
router.post('/', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'title': req.body.title,
            'recruitment': req.body.recruitment,
            'hosts': req.body.hosts,
            'categories': req.body.categories,
            'period': req.body.period,
            'cover': req.body.cover,
            'positions': req.body.positions
        };

        // 글 작성 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
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
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // DB에 모집 데이터 저장
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }

                        var insert = ['Contests',
                            back_data.users_id,
                            data.title,
                            data.recruitment,
                            data.hosts,
                            data.categories,
                            data.period,
                            data.cover,
                            data.positions];
                        connection.query("INSERT INTO ?? SET " +
                            "`cont_writer` = ?, " +
                            "`title` = ?, " +
                            "`recruitment` = ?, " +
                            "`hosts` = ?, " +
                            "`categories` = ?, " +
                            "`period` = ?, " +
                            "`cover` = ?, " +
                            "`positions` = ?, " +
                            "`postdate` = NOW()", insert, function (err) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                            }
                            connection.release();
                            callback(null);
                        });
                    });
                }
            ],
            function(err) {
                // 게시 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "글작성 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET applies list */
router.get('/applications', function(req, res, next) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
        };

        // 신청자 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
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
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 신청서 정보 확인
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', back_data.users_id];
                        connection.query("SELECT * FROM ?? WHERE app_users_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }

                            if (rows.length != 0) {
                                callback(null, rows);
                            } else {
                                callback({result: false, msg: '신청한 공고가 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 모집글 정보 가져옴
                    pool.getConnection(function (err, connection) {
                        // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
                        // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
                        var sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id IN (";

                        // contests id 갯수만큼 where절에 추가하기
                        var length = 0;
                        back_data.forEach(function (val, index, arr) {
                            if(length == 0) sql += val.app_contests_id;
                            sql += "," + val.app_contests_id;
                            length ++;
                            if (length == back_data.length) {
                                sql += ")";

                                console.log(sql);
                                connection.query(sql, function (err, rows) {
                                    if (err) {
                                        connection.release();
                                        return callback({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
                                    }
                                    connection.release();

                                    callback(null, rows);
                                });
                            }
                        });
                    });
                }
            ],
            function(err, result) {
                // 취소 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "신청목록 가져옴",
                    data: result
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET contests detail view */
router.get('/:contest_id', function(req, res) {
    var data = {
        'contest_id': req.params.contest_id
    };

    // 모집글 정보 가져옴
    pool.getConnection(function (err, connection) {
        var select = [data.contest_id];

        // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
        // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
        connection.query("SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id = ?", select, function (err, rows) {
            if (err) {
                connection.release();
                return res.send({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
            }
            connection.release();

            var dummy_data;
            if (rows.length != 0) {
                dummy_data = {
                    result : true,
                    msg : "상세 목록 가져옴",
                    data : rows[0]
                };
            } else {
                dummy_data = {
                    result: false,
                    msg: "모집글 정보가 없습니다."
                };
            }
            res.statusCode = 200;
            res.send(dummy_data);
        });
    });
});

/* PUT contest editing */
router.put('/:contest_id', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id,
            'title': req.body.title,
            'recruitment': req.body.recruitment,
            'hosts': req.body.hosts,
            'categories': req.body.categories,
            'period': req.body.period,
            'cover': req.body.cover,
            'positions': req.body.positions
        };

        // 글 수정 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
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
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = [data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM Contests WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '수정 권한이 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // DB에 모집 데이터 저장
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }

                        var insert = ['Contests',
                            data.title,
                            data.recruitment,
                            data.hosts,
                            data.categories,
                            data.period,
                            data.cover,
                            data.positions,
                            data.contest_id];
                        connection.query("UPDATE ?? SET " +
                            "`title` = ?, " +
                            "`recruitment` = ?, " +
                            "`hosts` = ?, " +
                            "`categories` = ?, " +
                            "`period` = ?, " +
                            "`cover` = ?, " +
                            "`positions` = ?" +
                            "WHERE contests_id = ?", insert, function (err) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                            }
                            connection.release();
                            callback(null);
                        });
                    });
                }
            ],
            function(err) {
                // 수정 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "수정 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* DELETE contests deleting */
router.delete('/:contest_id', function(req, res) {
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

        // 글 삭제 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
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
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = [data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM Contests WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '수정 권한이 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // DB에서 글 삭제
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }

                        var select = ['Contests',
                            data.contest_id];
                        connection.query("DELETE FROM ?? " +
                            "WHERE contests_id = ?", select, function (err) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                            }
                            connection.release();
                            callback(null);
                        });
                    });
                }
            ],
            function(err) {
                // 삭제 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "삭제 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET contests join form page */
router.get('/:contest_id/join', function(req, res, next) {
    // TODO duplicated
});

/* POST contests join process */
router.post('/:contest_id/join', function(req, res) {
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

        // 공모전 신청 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Users', data.access_token];
                        connection.query("SELECT users_id FROM ?? WHERE kakao_access_token = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 게시글 존재 확인
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Contests', data.contest_id];
                        connection.query("SELECT * FROM ?? WHERE contests_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '게시글이 존재하지 않습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 중복 신청 방지
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length == 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '이미 신청한 공고입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // DB에 신청 데이터 저장
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }

                        var insert = ['Applies',
                            data.contest_id,
                            back_data.users_id];

                        connection.query("INSERT INTO ?? SET " +
                            "`app_contests_id` = ?, " +
                            "`app_users_id` = ?, " +
                            "`postdate` = NOW()", insert, function (err) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                            }
                            connection.release();
                            callback(null);
                        });
                    });
                }
            // TODO 알림
            ],
            function(err) {
                // 게시 결과 출력
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "신청 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET contest appliers list */
router.get('/:contest_id/applies', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'contest_id': req.params.contest_id
        };

        // 공모전 신청서 목록 가져옴
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Users', data.access_token];
                        connection.query("SELECT users_id FROM ?? WHERE kakao_access_token = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = [data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM Contests WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '열람 권한이 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 신청서 목록 가져옴
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', data.contest_id, back_data.users_id];
                        connection.query("SELECT applies_id, app_users_id, postdate, is_check FROM ?? WHERE app_contests_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, rows);
                            } else {
                                callback({result: false, msg: '신청한 공고가 없습니다.'});
                            }
                        });
                    });
                }
            ],
            function(err, results) {
                // 신청서 목록 출력
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "신청자 목록 가져옴",
                    data : results
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* POST member adding */
router.post('/:contest_id/:applies_id', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id,
            'applies_id': req.params.applies_id
        };

        // 멤버 추가 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Users', data.access_token];
                        connection.query("SELECT users_id FROM ?? WHERE kakao_access_token = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = [data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM Contests WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();
                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '열람 권한이 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 신청서 정보 확인
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', data.contest_id, back_data.users_id];
                        connection.query("SELECT applies_id, app_users_id, postdate, is_check FROM ?? WHERE app_contests_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }

                            if (rows.length != 0) {
                                callback(null, rows[0].is_check);
                            } else {
                                callback({result: false, msg: '신청한 공고가 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 신청서 승낙/거절
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', !back_data, data.applies_id];
                        connection.query("UPDATE ?? SET " +
                            "is_check = ? " +
                            "WHERE applies_id = ? ", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return res.send({result: false, msg: "승낙하는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, rows);
                            } else {
                                callback({result: false, msg: '승낙할 신청서가 없습니다.'});
                            }
                        });
                    });
                }
            ],
            function(err) {
                // 멤버 추가 결과
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "멤버 변경 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* DELETE cancel apply */
router.delete('/:contest_id/:applies_id', function(req, res, next) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id,
            'applies_id': req.params.applies_id
        };

        // 신청서 삭제 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = [data.access_token];
                        connection.query("SELECT users_id FROM Users WHERE kakao_access_token = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            if (rows.length != 0) {
                                callback(null, { users_id : rows[0].users_id });
                            } else {
                                callback({result: false, msg: '잘못된 접근입니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // 신청서 정보 확인
                    pool.getConnection(function (err, connection) {
                        if (err) callback(err);
                        var select = ['Applies', data.applies_id, data.contest_id, back_data.users_id];
                        connection.query("SELECT * FROM ?? WHERE applies_id = ? AND app_contests_id = ? AND app_users_id = ?", select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }

                            if (rows.length != 0) {
                                callback(null, back_data);
                            } else {
                                callback({result: false, msg: '신청한 공고가 없습니다.'});
                            }
                        });
                    });
                },
                function(back_data, callback) {
                    // DB에서 신청서 삭제
                    pool.getConnection(function (err, connection) {
                        if (err) {
                            connection.release();
                            return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                        }

                        var select = ['Applies', data.applies_id];
                        connection.query("DELETE FROM ?? WHERE applies_id = ?", select, function (err) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                            }
                            connection.release();
                            callback(null);
                        });
                    });
                }
            ],
            function(err) {
                // 취소 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "취소 되었습니다."
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});


module.exports = router;
