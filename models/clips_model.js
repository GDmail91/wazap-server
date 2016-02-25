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

var clips_model = {

    /**
     * Get clips list
     * @param data (JSON) : users_id
     * @param callback (Function)
     */
    get_clips_list : function(data, callback) {
        // 찜 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select = [data.users_id];
            connection.query("SELECT cli_contests_id FROM Clips WHERE cli_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "찜 목록을 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "찜 목록 가져옴", data: rows });
                } else {
                    return callback({ result: false, msg: '찜 목록이 없습니다.' });
                }
            });
        });
    },

    /**
     * Check duplication of clips
     * @param data (JSON) : users_id, contest_id
     * @param callback (Function)
     */
    check_duplication : function(data, callback) {
        // DB에 찜 한 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });

            var select = ['Clips', data.users_id, data.contest_id];
            connection.query("SELECT * FROM ?? WHERE cli_users_id = ? AND cli_contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                if (rows.length == 0) return callback({ result: true, msg: "신청 가능합니다." });
                callback({ result: false, msg: "이미 찜한 게시물 입니다." }) ;
            });
        });
    },

    /**
     * Set clips each request
     * @param data (JSON) : users_id, contest_id
     * @param callback (Function)
     */
    set_clips : function(data, callback) {
        // DB에 찜 한 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });

            var insert = ['Clips', data.users_id, data.contest_id];
            connection.query("UPDATE ?? SET " +
                "`cli_users_id` = ?, " +
                "`cli_contests_id` = ? ", insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "찜 성공" }) ;
            });
        });
    },

    /**
     * Delete form clips table
     * @param data (JSON) : users_id, contest_id
     * @param callback (Function)
     */
    delete_from_clips : function(data, callback) {
        // DB에 찜 한 게시물 삭제
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: " +err });

            var select = ['Clips', data.users_id, data.contest_id];
            connection.query("DELETE FROM ?? WHERE users_id = ? AND contests_id = ? ", select, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                return callback({ result: true, msg: "찜 삭제 완료" });
            });
        });
    }
};

module.exports = clips_model;