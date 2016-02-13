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
     */
    get_clips_list : function(data) {
        // 찜 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var select = [data.users_id];
            connection.query("SELECT cli_contests_id FROM Clips WHERE cli_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "찜 목록을 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "찜 목록 가져옴", data: rows };
                } else {
                    return { result: false, msg: '찜 목록이 없습니다.' };
                }
            });
        });
    },

    /**
     * Set clips each request
     * @param data (JSON) : users_id, contest_id
     */
    set_clips : function(data) {
        // DB에 찜 한 게시물 저장
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };

            var insert = ['Clips', data.users_id, data.contest_id];
            connection.query("INSERT INTO ?? SET " +
                "`cli_users_id` = ?, " +
                "`cli_contests_id` = ? ", insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: "찜 성공" };
            });
        });
    },

    /**
     * Delete form clips table
     * @param data (JSON) : users_id, contest_id
     */
    delete_from_clips : function(data) {
        // DB에 찜 한 게시물 삭제
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: " +err };

            var select = ['Clips', data.users_id, data.contest_id];
            connection.query("DELETE FROM ?? WHERE contests_id = ? ", select, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: "찜 삭제 완료" };
            });
        });
    }
};

module.exports = clips_model;