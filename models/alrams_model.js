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

var alrams_model = {
    /**
     * Get alram list
     * @param data (JSON) : users_id, start_id, amount
     * @param callback (Function)
     */
    get_alram_list : function(data, callback) {
        // 알림 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select, sql;
            if (data.start_id == undefined) {
                select = [data.users_id, data.amount];
                sql = "SELECT alram_id, alram_users_id, alram_target_id, Users.username, Users.profile_img, msg, msg_url, is_check, alramdate FROM Alram " +
                    "INNER JOIN Users ON Alram.alram_target_id = Users.users_id " +
                    "WHERE alram_users_id = ? ORDER BY alramdate DESC LIMIT ?";
            }
            else {
                select = [data.users_id, data.start_id, data.amount];
                sql = "SELECT alram_id, alram_users_id, alram_target_id, Users.username, msg, msg_url, is_check, alramdate FROM Alram " +
                    "INNER JOIN Users ON Alram.alram_target_id = Users.users_id " +
                    "WHERE alram_users_id = ? AND alram_id <= ? ORDER BY alramdate DESC LIMIT ?";
            }
            var query = connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "알림 목록을 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "알림 목록 가져옴", data: rows });
                } else {
                    return callback({ result: false, msg: '알림 목록이 없습니다.' });
                }
            });
        });
    },

    /**
     * Set alram when apply
     * @param data (JSON) : cont_writer
     * @param callback (Function)
     */
    set_apply_alram : function(users_id, data, callback) {
        // Alram DB에 알림 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
            }

            var insert = ['Alram',
                data.cont_writer,
                users_id,
                '님이 ['+ data.title +']에 신청하였습니다.',
                '/contests/list/'+data.cont_writer];

            connection.query("INSERT INTO ?? SET " +
                "`alram_users_id` = ?, " +
                "`alram_target_id` = ?, " +
                "`msg` = ?, " +
                "`msg_url` = ?, " +
                "`alramdate` = NOW()", insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                callback({ result: true, msg: '알림 삽입' });
            });
        });
    },

    /**
     * Set alram when member add
     * @param data (JSON) : app_users_id
     * @param callback (Function)
     */
    set_member_add_alram : function(users_id, data, callback) {
        // Alram DB에 알림 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return callback({ result: false, msg: '알림 처리중 오류가 발생했습니다. 원인: ' + err });
            }

            var insert = ['Alram',
                data.app_users_id,
                users_id,
                '님이 ['+ data.title +'] 수락하였습니다.',
                '/contests/applications'];

            connection.query("INSERT INTO ?? SET " +
                "`alram_users_id` = ?, " +
                "`alram_target_id` = ?, " +
                "`msg` = ?, " +
                "`msg_url` = ?, " +
                "`alramdate` = NOW()", insert, function (err) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: '알림 처리중 오류가 발생했습니다. 원인: ' + err });
                }
                connection.release();
                callback({ result: true, msg: '알림 삽입' });
            });
        });
    }
};

module.exports = alrams_model;