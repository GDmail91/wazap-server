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
     * Set users status to block
     * @param data (JSON) : users_id
     */
    set_user_block : function(data) {
        // 사용자 계정 블럭
        if (!data.users_id) return { result: false, msg: "데이터가 없습니다."};
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var insert = ['Users', data.users_id];
            connection.query('INSERT INTO blocks SET ' +
                'type = ??, ' +
                'target_id = ?, ' +
                'postdate = NOW()', insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "계정 블럭에 실패했습니다. 원인: "+err };
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "계정 블럭에 성공했습니다."
                };
                return dummy_data;
            });
        });
    },

    /**
     * Set contest status to block
     * @param data (JSON) : contests_id
     */
    set_contest_block : function(data) {
        // 사용자 계정 블럭
        if (!data.contests_id) return { result: false, msg: "데이터가 없습니다."};
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var insert = ['Contests', data.contests_id];
            connection.query('INSERT INTO blocks SET ' +
                'type = ??, ' +
                'target_id = ?, ' +
                'postdate = NOW()', insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "게시물 블럭에 실패했습니다. 원인: "+err };
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "게시물 블럭에 성공했습니다."
                };
                return dummy_data;
            });
        });
    },

    /**
     * Set users status to normal
     * @param data (JSON) : users_id
     */
    set_user_normal : function(data) {
        // 사용자 블럭 상태 취소 (DB에서 데이터 삭제)
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: " +err };

            var select = ['Blocks', data.users_id];
            connection.query("DELETE FROM ?? WHERE users_id = ? ", select, function (err) {
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