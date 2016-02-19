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

var blocks_model = {
    /**
     * Get users status
     * @param data (JSON) : start_id, amount
     * @param callback (Function)
     */
    get_users_status : function(data, callback) {
        // 사용자 상태 보기
        if (data.start_id != undefined) {
            pool.getConnection(function (err, connection) {
                if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});

                var select = ['Blocks', 'Users', data.start_id, data.amount];
                connection.query("SELECT * FROM ?? WHERE type=?? AND blocks_id <= ? ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                    if (err) {
                        connection.release();
                        return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                    }
                    connection.release();
                    if (rows.length == 0) return callback({result: false, msg: '블럭된 사용자가 없습니다.'});
                    callback({result: true, msg: "사용자 블럭 상태 가져옴", data: rows});
                });
            });
        } else {
            pool.getConnection(function (err, connection) {
                if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});

                var select = ['Blocks', 'Users', data.amount];
                connection.query("SELECT * FROM ?? WHERE type=? ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                    if (err) {
                        connection.release();
                        return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                    }
                    connection.release();
                    if (rows.length == 0) return callback({result: false, msg: '블럭된 사용자가 없습니다.'});
                    callback({result: true, msg: "사용자 블럭 상태 가져옴", data: rows});
                });
            });
        }
    },

    /**
     * Get contests status
     * @param data (JSON) : start_id, amount
     * @param callback (Function)
     */
    get_contests_status : function(data, callback) {
        // 게시물 상태 보기

        if (data.start_id) {
            pool.getConnection(function (err, connection) {
                if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });

                var select = ['Blocks', 'Contests', data.start_id, data.amount];
                connection.query("SELECT * FROM ?? WHERE type=?? AND blocks_id <= ? ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                    if (err) {
                        connection.release();
                        return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                    }
                    connection.release();
                    if (rows.length == 0) return callback({result: false, msg: '블럭된 게시물이 없습니다.'});
                    callback({ result: true, msg: "게시물 블럭 상태 가져옴", data: rows });
                });
            });
        } else {
            pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});

            var select = ['Blocks', 'Contests', data.amount];
            connection.query("SELECT * FROM ?? WHERE type=?? ORDER BY postdate DESC LIMIT ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                }
                connection.release();
                if (rows.length == 0) return callback({result: false, msg: '블럭된 게시물이 없습니다.'});
                callback({result: true, msg: "게시물 블럭 상태 가져옴", data: rows});
            });
        });
    }
    },

    /**
     * Set users status to block
     * @param data (JSON) : users_id
     * @param callback (Function)
     */
    set_user_block : function(data, callback) {
        // 사용자 계정 블럭
        if (!data.users_id) return callback({ result: false, msg: "데이터가 없습니다."});
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var insert = ['Users', data.users_id];
            connection.query('INSERT INTO blocks SET ' +
                'type = ??, ' +
                'target_id = ?, ' +
                'postdate = NOW()', insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "계정 블럭에 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "계정 블럭에 성공했습니다."
                };
                return callback(dummy_data);
            });
        });
    },

    /**
     * Set contest status to block
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    set_contest_block : function(data, callback) {
        // 사용자 계정 블럭
        if (!data.contests_id) return callback({ result: false, msg: "데이터가 없습니다."});
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var insert = ['Contests', data.contests_id];
            connection.query('INSERT INTO blocks SET ' +
                'type = ??, ' +
                'target_id = ?, ' +
                'postdate = NOW()', insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "게시물 블럭에 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "게시물 블럭에 성공했습니다."
                };
                return callback(dummy_data);
            });
        });
    },

    /**
     * Set users status to normal
     * @param data (JSON) : users_id
     */
    set_user_normal : function(data, callback) {
        // 사용자 블럭 상태 취소 (DB에서 데이터 삭제)
        if (!data.users_id) return callback({ result: false, msg: "데이터가 없습니다."});
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });

            var select = ['Blocks', 'Users', data.users_id];
            connection.query("DELETE FROM ?? WHERE type=?? AND users_id = ? ", select, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "블럭 상태 취소" });
            });
        });
    },

    /**
     * Set contests status to normal
     * @param data (JSON) : contests_id
     * @param callback (Function)
     */
    set_contest_normal : function(data, callback) {
        // 사용자 블럭 상태 취소 (DB에서 데이터 삭제)
        if (!data.contests_id) return callback({ result: false, msg: "데이터가 없습니다."});
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });

            var select = ['Blocks', 'Contests', data.contests_id];
            connection.query("DELETE FROM ?? WHERE type=?? AND users_id = ? ", select, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "블럭 상태 취소" });
            });
        });
    }
};

module.exports = blocks_model;