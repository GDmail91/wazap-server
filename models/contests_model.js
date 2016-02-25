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

var contests_model = {
    /**
     * Contests recently list (MAIN)
     * @param data (JSON) : start_id, amount
     * @param callback (Function)
     */
    get_contests_list : function (data, callback) {
        pool.getConnection(function (err, connection) {
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var select, sql;
            if (data.start_id == undefined) {
                select = [data.amount];
                sql = "SELECT contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                    "ORDER BY postdate DESC LIMIT ? ";
            }
            else {
                select = [data.start_id, data.amount];
                sql = "SELECT contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish " +
                    "FROM Contests " +
                    "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                    "WHERE contests_id <= ? ORDER BY postdate DESC LIMIT ? ";
            }
console.log(select);
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err});
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
                callback(dummy_data);
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
                            function (in_callback) {
                                var insert = ['Contests',
                                    data.users_id,
                                    data.title,
                                    data.recruitment,
                                    data.hosts,
                                    JSON.stringify(data.categories),
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
                                    "`postdate` = NOW()", insert, function (err, rows) {
                                    if (err) {
                                        connection.rollback(function () {
                                            console.error('rollback error');
                                        });

                                        return in_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    }
                                    in_callback(null, rows.insertId);
                                });
                            },
                            function (insert_id, in_callback) {
                                // 모집글의 카테고리별로 DB에 저장
                                if (data.categories.length != 0) {
                                    var length = 0;
                                    data.categories.forEach(function (val) {
                                        categories_model.reg_contest(connection, { // 트랜잭션 처리 가능하도록 connection 변수 넣어줌
                                            contests_id: insert_id,
                                            category_name: val
                                        }, function (result) {
                                            if (result.result) {
                                                length++;
                                                if (length == data.categories.length) {
                                                    return in_callback(null, { result: true, msg: '저장 성공' });
                                                }
                                            } else {
                                                return in_callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                                            }
                                        })
                                    });
                                } else {
                                    return in_callback(null, { result: true, msg: '저장 성공' });
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
            connection.query("SELECT applies_id, contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish " +
                "FROM Contests, Users, Applies " +
                "WHERE app_users_id = ? " +
                "AND Applies.app_contests_id = Contests.contests_id " +
                "AND Contests.cont_writer = Users.users_id", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err });
                }

                if (rows.length != 0) {
                    return callback({ result:true, msg: "신청서 정보 목록", data: rows });
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
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var sql = "SELECT contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish FROM Contests " +
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
     * Get contest by id
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    get_contest_by_id : function(data, callback) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            var select = [data.contest_id];

            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            connection.query("SELECT contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish FROM Contests " +
                "INNER JOIN Users ON Contests.cont_writer = Users.users_id " +
                "WHERE contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err });
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
                return callback(dummy_data);
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

            connection.query("SELECT contests_id, title, recruitment, cont_writer, Users.username, hosts, categories, period, cover, positions, views, is_finish FROM Contests " +
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
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: '수정하기 완료.' });
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

            var insert = ['Applies', data.contest_id, data.users_id];

            connection.query("INSERT INTO ?? SET " +
                "`app_contests_id` = ?, " +
                "`app_users_id` = ?, " +
                "`postdate` = NOW()", insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "신청 완료" });
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
            connection.query("SELECT applies_id, app_users_id, postdate, is_check FROM ?? WHERE app_contests_id = ?", select, function (err, rows) {
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
     * @param data (JSON) : contest_id, users_id
     * @param callback (Function)
     */
    get_apply_info : function(data, callback) {
        // 신청서 정보 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT applies_id, app_users_id, Applies.postdate, is_check, Contests.title FROM ?? " +
                "INNER JOIN Contests ON Applies.app_contests_id = Contests.contests_id " +
                "WHERE app_contests_id = ?", select, function (err, rows) {
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
     * @param data (JSON) : is_check, applies_id
     * @param callback (Function)
     */
    accept_apply : function(data, callback) {
        // 신청서 승낙/거절
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });
            var select = ['Applies', !data.is_check, data.applies_id];
            connection.query("UPDATE ?? SET " +
                "is_check = ? " +
                "WHERE applies_id = ? ", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "승낙하는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "승낙 성공", data: rows });
                } else {
                    return callback({ result: false, msg: '승낙할 신청서가 없습니다. '});
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

            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("DELETE FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "삭제 완료" });
            });
        });
    },

    /**
     * Get contests list index by array
     * @param data (JSON) : start_id, amount
     * @param arr (Array)
     * @param callback (Function)
     */
    get_contests_by_array : function(data, arr, callback) {
        // 각 모집글 별로 정보 검색
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select_query = function() {
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

                            return callback({ result: true, msg: "찜 목록 가져옴", data: rows });
                        });
                    }
                });
            };

            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등

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

var categories_model = {
    /**
     * Registration each contest category (Need connection to rollback
     * @param connection (connection)
     * @param data (JSON) : contests_id, category_name
     * @param callback (Function)
     */
    reg_contest : function(connection, data, callback) {
        // 모집글 별 카테고리 등록
        // 가능한 카테고리명 ["디자인/UCC", "IT/개발", "마케팅/광고", "논문/문학", "게임"]
        if (data.category_name == "디자인/UCC"
        || "IT/개발"
        || "마케팅/광고"
        || "논문/문학"
        || "게임") {
            var insert = [data.contests_id, data.category_name];
            var sql = "INSERT INTO Categories SET cat_contests_id = ?, category_name = ?";

            // 카테고리명 별로 DB에 저장
            connection.query(sql, insert, function (err, rows) {
                if (err) {
                    connection.rollback(function () {
                        console.error('rollback error');
                        throw err;
                    });
                    return callback({result: false, msg: "카테고리를 저장하는데 실패했습니다. 원인: " + err});
                }

                return callback({result: true, msg: "카테고리 저장"});
            });
        } else {
            return callback({ result: false, msg: "카테고리명이 잘못되었습니다." });
        }
    },

    /**
     * Get categories by name
     * @param data (JSON) : category_name
     * @param callback (Function)
     */
    get_categories_by_name : function(data, callback) {
        // 카테고리 명으로 목록 가져오기
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });

            // 가능한 카테고리명 ["디자인/UCC", "IT/개발", "마케팅/광고", "논문/문학", "게임"]
            var select = [data.category_name];
            var sql = "SELECT * FROM Categories WHERE category_name = ?";

            // 카테고리명 별로 DB에 저장
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "카테고리를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                return callback({ result: true, msg: "카테고리명별 목록", data: rows});
            });
        });
    },

    /**
     * Get categories by id
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    get_categories_by_id : function(data, callback) {
        // 콘테스트 ID로 카테고리 명 가져오기
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });

            var select = [data.contests_id];
            var sql = "SELECT * FROM Categories WHERE cat_contests_id = ?";

            // 카테고리명 별로 DB에 저장
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "카테고리를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                return callback({ result: true, msg: "카테고리명 가져옴", data: rows});
            });
        });
    }
};

module.exports = contests_model;