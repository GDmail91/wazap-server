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
            connection.query(sql, insert, function (err, rows) {
                if (err) {
                    connection.rollback(function () {
                        console.error('rollback error');
                        throw err;
                    });
                    return callback({result: false, msg: "카테고리를 저장하는데 실패했습니다. 원인: " + err});
                }

                return callback({result: true, msg: "카테고리 저장", data: { category_id: rows.insertId }});
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
                            var sql = "SELECT categories_id FROM Categories WHERE category_name = ?";

                            // 카테고리 ID들을 가져옴
                            connection.query(sql, select, function (err, rows) {
                                if (err) {
                                    connection.rollback(function () {
                                        console.error('rollback error');
                                        return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                                    });
                                }
                                tran_callback(null, rows);
                            });
                        },
                        function (back_data, tran_callback) {
                            var select = ['Categories_Contests'];
                            var sql = "SELECT cat_con_id, cat_contests_id " +
                                "FROM ?? " +
                                "WHERE cat_categories_id IN (";
                            if (back_data.length != 0) {
                                var length = 0;
                                back_data.forEach(function (val) {
                                    if(length == 0) sql += val.categories_id;
                                    else sql += "," + val.categories_id;
                                    length ++;
                                    if (length == back_data.length) {
                                        sql += ")";

                                        connection.query(sql, select, function (err, rows) {
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
                                                return tran_callback(null, { result: true, msg: "카테고리별 목록 가져옴", data: rows });
                                            });
                                        });
                                    }
                                });
                            } else {
                                connection.rollback(function () {
                                    console.error('rollback error');
                                    return tran_callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: 카테고리 ID가 없습니다.'});
                                });
                            }
                        }
                    ], function (err, result) {
                        if (err) return callback(err);
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
            var sql = "SELECT * FROM Categories_Contests WHERE cat_contests_id = ?";

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
    },

    get_category_name_by_id : function(data, callback) {
        // 카테고리 이름 가져오기
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });

            var select = [data.contests_id];
            var sql = "SELECT cat_con.cat_con_id, cat_con.cat_contests_id, cat.category_name " +
                "FROM Categories_Contests AS cat_con " +
                "INNER JOIN Categories AS cat " +
                "ON cat_con.cat_categories_id = cat.categories_id " +
                "WHERE cat_con.cat_contests_id = ?";

            // 카테고리명 별로 DB에 저장
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "카테고리를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var result = [];
                rows.forEach(function(val) {
                    result.push(val.category_name);
                });
                return callback({ result: true, msg: "카테고리명 가져옴", data: result});
            });
        });
    }
};

module.exports = categories_model;