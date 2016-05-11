var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    host    : credentials.mysql_crawl.host,
    port : credentials.mysql_crawl.port,
    user : credentials.mysql_crawl.user,
    password : credentials.mysql_crawl.password,
    database: credentials.mysql_crawl.database,
    connectionLimit: 20,
    waitForConnections: false
});

var weekly_list_model = {

    /**
     * Get list of weekly contests
     * @param data (JSON) : start_id, amount
     * @param callback (Function)
     */
    get_weekly_list : function(data, callback) {
        // 주간 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var select;
            var sql = "SELECT * FROM CONTEST ";

            if (typeof data.start_id == 'undefined') {
                select = [data.amount];
                sql += "ORDER BY DEADLINE_DATE DESC LIMIT ? ";
            } else {
                select = [data.start_id, data.amount];
                sql += "WHERE ID <= ? ORDER BY DEADLINE_DATE ASC LIMIT ? ";
            }
            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "주간 목록을 가져오는데 실패했습니다. 원인: " + err });
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "주간 목록 가져옴", data: rows });
                } else {
                    return callback({ result: false, msg: '주간 목록이 없습니다.' });
                }
            });
        });
    }
};

module.exports = weekly_list_model;