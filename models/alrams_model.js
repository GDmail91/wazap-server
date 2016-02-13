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
     * @param data
     */
    get_alram_list : function(data) {
        // 알림 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var select, sql;
            if (data.start_id == undefined) {
                select = [data.users_id, data.amount];
                sql = "SELECT * FROM Alram WHERE alram_users_id = ? ORDER BY alramdate DESC LIMIT ?";
            }
            else {
                select = [data.users_id, data.start_id, data.amount];
                sql = "SELECT * FROM Alram WHERE alram_users_id = ? AND alram_id <= ? ORDER BY alramdate DESC LIMIT ?";
            }
            var query = connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "알림 목록을 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "알림 목록 가져옴", data: rows };
                } else {
                    return { result: false, msg: '알림 목록이 없습니다.' };
                }
            });
            console.log(query);
        });
    }
};

module.exports = alrams_model;