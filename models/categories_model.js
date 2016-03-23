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

var categories_model = {
    /**
     * Registration each contest category (Need connection to rollback
     * @param connection (connection)
     * @param data (JSON) : contests_id, category_name
     * @param callback (Function)
     */
    reg_contest : function(connection, data, callback) {
        // 모집글 별 카테고리 등록
        // TODO
        // 가능한 카테고리명 ["광고/아이디어/마케팅", "디자인", "사진/UCC", "게임/소프트웨어", "해외", "기타"]
        if (data.category_name == "광고/아이디어/마케팅"
        || "디자인"
        || "사진/UCC"
        || "게임/소프트웨어"
        || "해외"
        || "기타") {
            var insert = [data.contests_id, data.category_name];
            var sql = "INSERT INTO Categories_Contests " +
                "SET Categories_Contests.cat_contests_id = ?, " +
                "Categories_Contests.cat_categories_id = (SELECT categories_id FROM Categories WHERE category_name = ?)";

            // 카테고리명 별로 DB에 저장
            connection.query(sql, insert, function (err) {
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
     * Delete categories by contest id
     * @param connection (connection)
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    delete_categories_by_contests : function(connection, data, callback) {
        var select = [data.contests_id];
        var sql = "DELETE FROM Categories_Contests WHERE cat_contests_id = ?";

        // 카테고리명 별로 DB에 저장
        connection.query(sql, select, function (err) {
            if (err) {
                connection.rollback(function () {
                    console.error('rollback error');
                    throw err;
                });
                return callback({result: false, msg: "카테고리를 삭제하는데 실패했습니다. 원인: " + err});
            }

            return callback({result: true, msg: "카테고리 삭제"});
        });
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
            connection.beginTransaction(function(err) {
                if (err) {
                    throw err;
                } else {
                    var async = require('async');
                    async.waterfall([
                        function (tran_callback) {
                            // 카테고리 ID 가져오기
                            // 가능한 카테고리명 ["광고/아이디어/마케팅", "디자인", "사진/UCC", "게임/소프트웨어", "해외", "기타"]
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

module.exports = categories_model;