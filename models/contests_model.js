var credentials = require('../credentials');
var categories_model = require('./categories_model');
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

var contests_model = {
    /**
     * Contests recently list (MAIN)
     * @param data (JSON) : start_id, amount, users_id
     * @param callback (Function)
     */
    get_contests_list : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select, sql;
            if (typeof data.users_id == 'undefined') {
                sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, postdate, members, appliers, clips, views, is_finish " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id ";
            } else {
                sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, postdate, members, appliers, clips, views, is_finish, " +
                    "(SELECT COUNT(cli_contests_id) FROM Clips WHERE cli_contests_id = Contests.contests_id AND cli_users_id = " + data.users_id + ") AS is_clip " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id ";
            }
            if (data.start_id == undefined) {
                select = [data.amount];
                sql += "ORDER BY postdate DESC LIMIT ? ";
            } else {
                select = [data.start_id, data.amount];
                sql += "WHERE contests_id <= ? ORDER BY postdate DESC LIMIT ? ";
            }

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    // 카테고리 이름 파싱
                    var length = 0;
                    rows.forEach(function(val, index) {
                        categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                            if (result.result) {
                                rows[index].categories1 = result.data[0];
                                rows[index].categories2 = result.data[1];

                                rows[index].categories = JSON.stringify(result.data);

                                length++;
                                if (length == rows.length) {
                                    return callback(dummy_data = {
                                        result: true,
                                        msg: "모집글 목록 가져옴",
                                        data: rows
                                    });
                                }

                            } else {
                                return callback(dummy_data = {
                                    result: false,
                                    msg: result.msg
                                });
                            }
                        });
                    });
                } else {
                    return callback(dummy_data = {
                        result: false,
                        msg: "모집글 정보가 없습니다."
                    });
                }
            });
        });
    },

    /**
     * Post contest recruit infomation
     * @param data (JSON) : users_id, title, recruitment, hosts, categories, period, cover, positions
     * @param callback (Function)
     */
    set_contests_recruit : function (data, callback) {
        // DB에 모집 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }
            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                            function (tran_callback) {
                                var insert = ['Contests',
                                    data.users_id,
                                    data.title,
                                    data.cont_title,
                                    data.recruitment,
                                    data.hosts,
                                    data.period,
                                    data.cover,
                                    data.cont_locate,
                                    data.positions];
                                connection.query("INSERT INTO ?? SET " +
                                    "`cont_writer` = ?, " +
                                    "`title` = ?, " +
                                    "`cont_title` = ?, " +
                                    "`recruitment` = ?, " +
                                    "`hosts` = ?, " +
                                    "`period` = ?, " +
                                    "`cover` = ?, " +
                                    "`cont_locate` = ?, " +
                                    "`positions` = ?, " +
                                    "`postdate` = NOW()", insert, function (err, rows) {
                                    if (err) {
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                        });

                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    tran_callback(null, rows.insertId);
                                });
                            },
                            function (contests_id, tran_callback) {
                                // 모집글의 카테고리별로 DB에 저장
                                if (data.categories.length != 0) {
                                    var length = 0;
                                    var category_id = [];
                                    data.categories.forEach(function (val) {
                                        categories_model.reg_contest(connection, { // 트랜잭션 처리 가능하도록 connection 변수 넣어줌
                                            contests_id: contests_id,
                                            category_name: val
                                        }, function (result) {
                                            if (result.result) {
                                                length++;
                                                category_id.push(result.data.category_id);
                                                if (length == data.categories.length) {
                                                    return tran_callback(null, contests_id, category_id);
                                                }
                                            } else {
                                                return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                            }
                                        })
                                    });
                                } else {
                                    return tran_callback(null, { result: true, msg: '저장 성공' });
                                }
                            },
                            function (contests_id, category_id, tran_callback) {
                                var update = [];
                                update.push('Contests');
                                var query = "";
                                if (category_id.length == 2) {
                                    update.push(category_id[0],
                                                category_id[1],
                                                contests_id);

                                    query = "UPDATE ?? SET " +
                                        "`categories1` = ?, " +
                                        "`categories2` = ? " +
                                        "WHERE contests_id=?"
                                } else if (category_id.length == 1) {
                                    update.push(category_id[0],
                                                contests_id);

                                    query = "UPDATE ?? SET " +
                                        "`categories1` = ? " +
                                        "WHERE contests_id=?"
                                } else {
                                    return tran_callback(null, { result: true, msg: '저장 성공' });
                                }

                                connection.query(query, update, function (err, rows) {
                                    if (err) {
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                        });

                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }


                                    return tran_callback(null, { result: true, msg: '저장 성공' });
                                });
                            }],
                        function (err, result) {
                            if (err) return err;
                            connection.commit(function (err) {
                                if (err) {
                                    console.error(err);
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        throw err;
                                    });
                                }
                                callback(result);
                            });
                        });
                }
            });
        });
    },

    /**
     * Get application informations
     * @param data (JSON) users_id
     * @param callback (Function)
     */
    get_application_info : function (data, callback) {
        // 신청서 정보 확인
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러발생. 원인: "+err });
            var select = [data.users_id];
            connection.query("SELECT applies_id, contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish " +
                "FROM Contests, Users, Applies " +
                "WHERE app_users_id = ? " +
                "AND Applies.app_contests_id = Contests.contests_id " +
                "AND Contests.cont_writer = Users.users_id", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }

                if (rows.length != 0) {
                    // 카테고리 이름 파싱
                    var length = 0;
                    rows.forEach(function(val, index) {
                        categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                            if (result.result) {
                                rows[index].categories1 = result.data[0];
                                rows[index].categories2 = result.data[1];

                                rows[index].categories = JSON.stringify(result.data);

                                length++;
                                if (length == rows.length) {
                                    return callback({ result:true, msg: "신청서 정보 목록", data: rows });
                                }

                            } else {
                                return callback({
                                    result: false,
                                    msg: result.msg
                                });
                            }
                        });
                    });
                } else {
                    return callback({ result: false, msg: '신청한 공고가 없습니다.' });
                }
            });
        });
    },

    /**
     * Get contest infomation
     * @param data (JSON) : contests_id (Array)
     * @param callback (Function)
     */
    get_contest_info : function(data, callback) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            var sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish FROM Contests " +
                "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                "WHERE contests_id IN (";

            // contests id 갯수만큼 where절에 추가하기
            var length = 0;
            data.forEach(function (val) {
                if(length == 0) sql += val.app_contests_id;
                else sql += "," + val.app_contests_id;
                length ++;
                if (length == data.length) {
                    sql += ")";

                    connection.query(sql, function (err, rows) {
                        if (err) {
                            connection.release();
                            return callback({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
                        }
                        connection.release();

                        return callback({ result: true, msg: "모집글 정보를 가져왔습니다.", data: rows });
                    });
                }
            });
        });
    },

    /**
     * Get contests list by writer id
     * @param data (JSON) : writer_id
     * @param callback (Function)
     */
    get_contests_list_by_writer : function(data, callback) {
        // 해당 유저의 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러발생. 원인: "+err });
            var select = [data.writer_id];
            connection.query("SELECT * FROM Contests WHERE cont_writer = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "게시글 정보 가져옴", data: rows });
                } else {
                    return callback({ result: false, msg: '게시글이 없습니다.' });
                }
            });
        });
    },

    /**
     * Get contests and finish
     * @param callback (Function)
     */
    get_contests_and_finishing : function(callback) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            connection.query("SELECT contests_id FROM Contests " +
                "WHERE is_finish = false AND period <= NOW()", function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                var sql = "UPDATE Contests SET is_finish=true WHERE contests_id IN (";

                // contests id 갯수만큼 where절에 추가하기
                var length = 0;
                rows.forEach(function (val) {
                    if(length == 0) sql += val.contests_id;
                    else sql += "," + val.contests_id;
                    length ++;
                    if (length == rows.length) {
                        sql += ")";

                        connection.query(sql, function (err) {
                            if (err) {
                                connection.release();
                                return callback({ result: false, msg: "모집글을 마감하는데 실패했습니다. 원인: "+err });
                            }
                            connection.release();

                            return callback({ result: true, msg: "모집글을 마감하였습니다." });
                        });
                    }
                });
            });
        });
    },

    /**
     * Get contest by id
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    get_contest_by_id : function(data, callback) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            if (err) throw err;
            connection.beginTransaction(function(err) {
                if (err) throw err;
                else {
                    var async = require('async');
                    async.waterfall([
                        function (tran_callback) {
                            var select = [data.contest_id];
                            connection.query("SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, Users.profile_img, Users.kakao_id, hosts, categories1, categories2, period, cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish, " +
                                "(SELECT COUNT(cli_contests_id) FROM Clips WHERE cli_contests_id = Contests.contests_id AND cli_users_id = " + data.users_id + ") AS is_clip, " +
                                "(SELECT COUNT(applies_id) FROM Applies WHERE app_contests_id = contests_id AND app_users_id = " + data.users_id + ") AS is_apply " +
                                "FROM Contests " +
                                "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                                "WHERE contests_id = ?", select, function (err, rows) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
                                    });
                                }

                                var dummy_data;
                                if (rows.length != 0) {
                                    // 카테고리 이름 파싱
                                    var length = 0;
                                    rows.forEach(function(val, index) {
                                        categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                                            if (result.result) {
                                                rows[index].categories1 = result.data[0];
                                                rows[index].categories2 = result.data[1];

                                                rows[index].categories = JSON.stringify(result.data);

                                                length++;
                                                if (length == rows.length) {
                                                    return tran_callback(null, {
                                                        result : true,
                                                        msg : "상세 목록 가져옴",
                                                        data : rows[0]
                                                    });
                                                }

                                            } else {
                                                return tran_callback(dummy_data = {
                                                    result: false,
                                                    msg: result.msg
                                                });
                                            }
                                        });
                                    });
                                } else {
                                    return tran_callback(dummy_data = {
                                        result: false,
                                        msg: "모집글 정보가 없습니다."
                                    });
                                }
                            });
                        },
                        function (dummy_data, tran_callback) {
                            var insert = ['Contests', data.contest_id];

                            connection.query("UPDATE ?? SET views = views+1 WHERE contests_id = ?", insert, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                connection.commit(function (err) {
                                    if (err) {
                                        console.error(err);
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                            throw err;
                                        });
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    return tran_callback(null, dummy_data);
                                });
                            });
                        }
                    ], function (err, result) {
                        callback(result);
                    });
                }
            });
        });
    },

    /**
     * Authentication of contest
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    is_contest_writer : function(data, callback) {
        // 게시글 권한 인증
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = [data.contest_id, data.users_id];

            connection.query("SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish FROM Contests " +
                "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                "WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "게시글에 대한 권한 확인"});
                } else {
                    return callback({ result: false, msg: '수정 권한이 없습니다.' });
                }
            });
        });
    },

    /**
     * Edit contest infomation
     * @param data (JSON) : title, recrument, hosts, categories, period, cover, positions, contest_id
     * @param callback (Function)
     */
    edit_contests_info : function(data, callback) {
        // DB에 모집 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }

            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                            function (tran_callback) {
                                var update = ['Contests',
                                    data.title,
                                    data.cont_title,
                                    data.recruitment,
                                    data.hosts,
                                    data.categories[0],
                                    data.categories[1],
                                    data.period,
                                    data.cover,
                                    data.cont_locate,
                                    data.positions,
                                    data.contest_id];
                                connection.query("UPDATE ?? SET " +
                                    "`title` = ?, " +
                                    "`cont_title` = ?, " +
                                    "`recruitment` = ?, " +
                                    "`hosts` = ?, " +
                                    "`categories1` = ?, " +
                                    "`categories2` = ?, " +
                                    "`period` = ?, " +
                                    "`cover` = ?, " +
                                    "`cont_locate` = ?, " +
                                    "`positions` = ?" +
                                    "WHERE contests_id = ?", update, function (err) {
                                    if (err) {
                                        console.error(err);
                                        connection.rollback(function() {
                                            console.error('rollback error');
                                            return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                        });
                                    }
                                    return tran_callback(null);
                                });
                            },
                            function (tran_callback) {
                                // 기존 카테고리 삭제
                                categories_model.delete_categories_by_contests(connection, { // 트랜잭션 처리 가능하도록 connection 변수 넣어줌
                                    contests_id: data.contest_id
                                }, function (result) {
                                    if (result.result) {
                                            return tran_callback(null);
                                    } else {
                                        return tran_callback({ result: false, msg: '삭제중 오류가 발생했습니다. 원인: ' + err });
                                    }
                                })
                            },
                            function (tran_callback) {
                                // 모집글의 카테고리별로 DB에 저장
                                if (data.categories.length != 0) {
                                    var length = 0;
                                    data.categories.forEach(function (val) {
                                        categories_model.reg_contest(connection, { // 트랜잭션 처리 가능하도록 connection 변수 넣어줌
                                            contests_id: data.contest_id,
                                            category_name: val
                                        }, function (result) {
                                            if (result.result) {
                                                length++;
                                                if (length == data.categories.length) {
                                                    return tran_callback(null, { result: true, msg: '저장 성공' });
                                                }
                                            } else {
                                                return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                            }
                                        })
                                    });
                                } else {
                                    return tran_callback(null, { result: true, msg: '저장 성공' });
                                }
                            }],
                        function (err, result) {
                            if (err) return err;
                            connection.commit(function (err) {
                                if (err) {
                                    console.error(err);
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        throw err;
                                    });
                                }
                                callback({result: true, msg: '수정하기 완료.' });
                            });
                        });
                }
            });
        });
    },

    /**
     * Remove from contests table
     * @param data (JSON) : contest_id
     * @param callback (Function)
     */
    remove_contest : function(data, callback) {
        // DB에서 글 삭제
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }

            var select = ['Contests', data.contest_id];
            connection.query("DELETE FROM ?? WHERE contests_id = ?", select, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: '게시글 삭제 완료' });
            });
        });
    },

    /**
     * Check duplicate apply
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    check_duplication : function(data, callback) {
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT * FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length == 0) {
                    return callback({ result: true, msg: "중복값 없음" });
                } else {
                    return callback({ result: false, msg: '이미 신청한 공고입니다.' });
                }
            });
        });
    },

    /**
     * Apply on contest
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    apply_contest : function(data, callback) {
        // DB에 신청 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }
            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                        function (tran_callback) {
                            var insert = ['Applies', data.contest_id, data.users_id];

                            connection.query("INSERT INTO ?? SET " +
                                "`app_contests_id` = ?, " +
                                "`app_users_id` = ?, " +
                                "`postdate` = NOW()", insert, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                return tran_callback(null);
                            });
                        },
                        function (tran_callback) {
                            var insert = ['Contests', data.contest_id];

                            connection.query("UPDATE ?? SET appliers = appliers+1 WHERE contests_id = ?", insert, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                connection.commit(function (err) {
                                    if (err) {
                                        console.error(err);
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                            throw err;
                                        });
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    return tran_callback(null, {result: true, msg: "신청 완료"});
                                });
                            });
                        }
                    ], function (err, result) {
                        callback(result);
                    });
                }
            });
        });
    },

    /**
     * Get member list
     * @param data (JSON) : contest_id
     * @param callback (Function)
     */
    get_member_list : function(data, callback) {
        // 신청서 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생 원인: "+err });
            var select = ['Applies', data.contest_id];
            connection.query("SELECT app_users_id AS users_id, Users.username, Users.profile_img FROM ??, Users, Contests " +
                "WHERE Applies.app_users_id = Users.users_id " +
                "AND Applies.app_contests_id = Contests.contests_id " +
                "AND app_contests_id = ? " +
                "AND Applies.is_check = true", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "멤버 목록을 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "멤버 목록 가져옴", data: rows });
                } else {
                    return callback({ result: true, msg: '멤버 목록이 없습니다.' });
                }
            });
        });
    },

    /**
     * Get applies list
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    get_apply_list : function(data, callback) {
        // 신청서 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생 원인: "+err });
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT applies_id, app_users_id, Applies.postdate, is_check, Users.username, Users.profile_img FROM ??, Users, Contests " +
                "WHERE Applies.app_users_id = Users.users_id " +
                "AND Applies.app_contests_id = Contests.contests_id " +
                "AND app_contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "신청서 목록 가져옴", data: rows });
                } else {
                    return callback({ result: false, msg: '신청한 공고가 없습니다.' });
                }
            });
        });
    },

    /**
     * Get apply infomation
     * @param data (JSON) : contest_id, applies_id
     * @param callback (Function)
     */
    get_apply_info : function(data, callback) {
        // 신청서 정보 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT applies_id, app_users_id, Applies.postdate, is_check, Contests.title FROM ?? " +
                "INNER JOIN Contests ON Applies.app_contests_id = Contests.contests_id " +
                "WHERE app_contests_id = ? AND app_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }

                if (rows.length != 0) {
                    return callback({ result: true, msg: "신청서 정보 가져옴", data: rows[0] });
                } else {
                    return callback({ result: false, msg: '신청한 공고가 없습니다.' });
                }
            });
        });
    },

    /**
     * Get apply infomation by id
     * @param data (JSON) : applies_id
     * @param callback (Function)
     */
    get_apply_info_by_id : function(data, callback) {
        // 신청서 정보 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = ['Applies', data.applies_id];
            connection.query("SELECT applies_id, app_users_id, Applies.postdate, is_check, Contests.title FROM ?? " +
                "INNER JOIN Contests ON Applies.app_contests_id = Contests.contests_id " +
                "WHERE applies_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }

                if (rows.length != 0) {
                    return callback({ result: true, msg: "신청서 정보 가져옴", data: rows[0] });
                } else {
                    return callback({ result: false, msg: '신청한 공고가 없습니다.' });
                }
            });
        });
    },

    /**
     * Accept or Defuse apply
     * @param data (JSON) : is_check, applies_id, contest_id
     * @param callback (Function)
     */
    accept_apply : function(data, callback) {
        // 신청서 승낙/거절
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });
            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                        function (tran_callback) {
                            var select = ['Applies', !data.is_check, data.applies_id];
                            connection.query("UPDATE ?? SET " +
                                "is_check = ? " +
                                "WHERE applies_id = ? ", select, function (err, rows) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({ result: false, msg: "승낙하는데 실패했습니다. 원인: " + err });
                                    });
                                }

                                if (rows.length != 0) {
                                    return tran_callback(null);
                                } else {
                                    return tran_callback({ result: false, msg: '승낙할 신청서가 없습니다. '});
                                }
                            });
                        },
                        function (tran_callback) {
                            var insert = ['Contests', data.contest_id, data.contest_id];

                            connection.query("UPDATE ?? " +
                                "SET members = (SELECT COUNT(applies_id) FROM Applies WHERE app_contests_id = ? AND is_check = true) " +
                                "WHERE contests_id = ?", insert, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                connection.commit(function (err) {
                                    if (err) {
                                        console.error(err);
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                            throw err;
                                        });
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    return tran_callback(null, { result: true, msg: "승낙 성공" });
                                });
                            });
                        }
                    ], function (err, result) {
                        callback(result);
                    });
                }
            });

        });
    },

    /**
     * Delete from apply
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    delete_from_apply : function(data, callback) {
        // DB에서 신청서 삭제
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }
            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                        function (tran_callback) {

                            var select = ['Applies', data.contest_id, data.users_id];
                            connection.query("DELETE FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                    });
                                }
                                return tran_callback(null);
                            });
                        },
                        function (tran_callback) {
                            var insert = ['Contests', data.contest_id];

                            connection.query("UPDATE ?? SET appliers = appliers - 1 WHERE contests_id = ?", insert, function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                connection.commit(function (err) {
                                    if (err) {
                                        console.error(err);
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                            throw err;
                                        });
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    return tran_callback(null, { result: true, msg: "삭제 완료" });
                                });
                            });
                        }
                    ], function (err, result) {
                        callback(result);
                    });
                }
            });
        });
    },

    /**
     * Get contests list index by clips array
     * @param data (JSON) : users_id, start_id, amount
     * @param arr (Array)
     * @param callback (Function)
     */
    get_contests_by_clips_array : function(data, arr, callback) {
        // 각 모집글 별로 정보 검색
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select_query = function() {
                var select = [data.users_id, data.amount];
                var sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, hosts, categories1, categories2, period, " +
                    "cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish, " +
                    "(SELECT COUNT(applies_id) FROM Applies WHERE app_contests_id = contests_id AND app_users_id = ?) AS is_apply " +
                    "FROM Contests WHERE contests_id IN (";

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

                            // 카테고리 이름 파싱
                            var length = 0;
                            rows.forEach(function(val, index) {
                                categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                                    if (result.result) {
                                        rows[index].categories1 = result.data[0];
                                        rows[index].categories2 = result.data[1];

                                        rows[index].categories = JSON.stringify(result.data);

                                        length++;
                                        if (length == rows.length) {
                                            return callback({ result: true, msg: "찜 목록 가져옴", data: rows });
                                        }

                                    } else {
                                        return callback({
                                            result: false,
                                            msg: result.msg
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            };

            var contests_list=  [];
            if (data.start_id == undefined) {
                contests_list = arr;
                select_query();
            } else {
                var count = 1;
                arr.forEach(function (val, index) {
                    if (val.cli_contests_id <= data.start_id) {
                        contests_list[index] = { cli_contests_id: val.cli_contests_id };
                    }
                    if (count == arr.length) {
                        select_query();
                    } else count++;
                });
            }
        });
    },

    /**
     * Get contests list index by category array
     * @param data (JSON) : users_id, start_id, amount
     * @param arr (Array)
     * @param callback (Function)
     */
    get_contests_by_category_array : function(data, arr, callback) {
        // 각 모집글 별로 정보 검색
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select_query = function () {
                var select = [data.users_id, data.users_id, data.amount];
                var sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, hosts, categories1, categories2, period, " +
                    "cover, cont_locate, positions, Contests.postdate, members, appliers, clips, views, is_finish, " +
                    "(SELECT COUNT(applies_id) FROM Applies WHERE app_contests_id = contests_id AND app_users_id = ?) AS is_apply, " +
                    "(SELECT COUNT(cli_contests_id) FROM Clips WHERE cli_contests_id = Contests.contests_id AND cli_users_id = ?) AS is_clip " +
                    "FROM Contests WHERE contests_id IN (";

                // contests id 갯수만큼 where절에 추가하기
                var length = 0;
                contests_list.forEach(function (val) {
                    if (length == 0) sql += val.cat_contests_id;
                    else sql += "," + val.cat_contests_id;
                    length++;
                    if (length == contests_list.length) {
                        sql += ") ORDER BY postdate DESC LIMIT ?";

                        var query = connection.query(sql, select, function (err, rows) {
                            if (err) {
                                connection.release();
                                return callback({result: false, msg: "카테고리별 목록 정보를 가져오는데 실패했습니다. 원인: " + err});
                            }
                            connection.release();

                            // 카테고리 이름 파싱
                            var length = 0;
                            rows.forEach(function(val, index) {
                                categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                                    if (result.result) {
                                        rows[index].categories1 = result.data[0];
                                        rows[index].categories2 = result.data[1];

                                        rows[index].categories = JSON.stringify(result.data);

                                        length++;
                                        if (length == rows.length) {
                                            return callback({result: true, msg: "카테고리별 목록 가져옴", data: rows});
                                        }

                                    } else {
                                        return callback({
                                            result: false,
                                            msg: result.msg
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            };

            var contests_list=  [];
            if (arr.length != 0) {
                if (data.start_id == undefined) {
                    contests_list = arr;
                    select_query();
                } else {
                    var count = 1;
                    arr.forEach(function (val, index) {
                        if (val.cat_contests_id <= data.start_id) {
                            contests_list[index] = {cat_contests_id: val.cat_contests_id};
                        }
                        if (count == arr.length) {
                            select_query();
                        } else count++;
                    });
                }
            } else {
                return callback({result: false, msg: "카테고리별 목록 정보를 가져오는데 실패했습니다. 원인: 목록이 없습니다."});
            }
        });
    },

    /**
     * Contests list by title
     * @param data (JSON) : users_id, start_id, amount, search
     * @param callback (Function)
     */
    get_contests_by_title : function (data, callback) {
        pool.getConnection(function (err, connection) {
            var select, sql;
            if (typeof data.users_id == "undefined") {
                sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, postdate, members, appliers, clips, views, is_finish " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id ";
            } else {
                sql = "SELECT contests_id, title, cont_title, recruitment, cont_writer, Users.username, hosts, categories1, categories2, period, cover, cont_locate, positions, postdate, members, appliers, clips, views, is_finish, " +
                    "(SELECT COUNT(cli_contests_id) FROM Clips WHERE cli_contests_id = Contests.contests_id AND cli_users_id = " + data.users_id + ") AS is_clip " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id ";
            }
            if (data.start_id == undefined) {
                select = [data.search, data.amount];
                sql += "WHERE title LIKE ? ORDER BY postdate DESC LIMIT ? ";
            } else {
                select = [data.search, data.start_id, data.amount];
                sql += "WHERE contests_id <= ? AND title LIKE ? ORDER BY postdate DESC LIMIT ? ";
            }

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "검색 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    // 카테고리 이름 파싱
                    var length = 0;
                    rows.forEach(function(val, index) {
                        categories_model.get_category_name_by_id({ contests_id: val.contests_id }, function(result) {
                            if (result.result) {
                                rows[index].categories1 = result.data[0];
                                rows[index].categories2 = result.data[1];

                                rows[index].categories = JSON.stringify(result.data);

                                length++;
                                if (length == rows.length) {
                                    return callback(dummy_data = {
                                        result: true,
                                        msg: "검색 목록 가져옴",
                                        data: rows
                                    });
                                }

                            } else {
                                return callback(dummy_data = {
                                    result: false,
                                    msg: result.msg
                                });
                            }
                        });
                    });
                } else {
                    return callback(dummy_data = {
                        result: false,
                        msg: "검색 정보가 없습니다."
                    });
                }
            });
        });
    },

    /**
     * Set contests status to finish
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    set_contests_finish : function(data, callback) {
        // 모집글 마감 설정
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });
            var select = ['Contests', data.contest_id];
            connection.query("UPDATE ?? SET " +
                "is_finish = true " +
                "WHERE contests_id = ? ", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "마감설정을 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "마감하였습니다.", data: rows });
                } else {
                    return callback({ result: false, msg: '글이 존재하지 않습니다.' });
                }
            });
        });
    }
};

module.exports = contests_model;