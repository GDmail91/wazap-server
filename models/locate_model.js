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

var locate_model = {
    /**
     * Get state name list
     * @param data (JSON)
     * @param callback (Function)
     */
    get_state_list : function(data, callback) {
        // 시,구 정보 가져오기
            pool.getConnection(function (err, connection) {
                if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});

                var select = ['Locate', 'state'];
                connection.query("SELECT state FROM ?? GROUP BY ??", select, function (err, rows) {
                    if (err) {
                        connection.release();
                        return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                    }
                    connection.release();
                    if (rows.length == 0) return callback({result: false, msg: '저장된 데이터가 없습니다.'});
                    var list = [];
                    rows.forEach(function(val) {
                        list.push(val.state);
                        if(list.length == rows.length) {
                            callback({result: true, msg: "시, 구 정보 가져옴", data: list});
                        }
                    });
                });
            });
    },

    /**
     * Get city name list
     * @param data (JSON) : state_name
     * @param callback (Function)
     */
    get_city_list : function(data, callback) {
        // 구, 군 정보 가져오기
        pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "에러 발생. 원인: " + err});

            var select = ['Locate', data.state_name];
            connection.query("SELECT city FROM ?? WHERE state=?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err});
                }
                connection.release();
                if (rows.length == 0) return callback({result: false, msg: '저장된 데이터가 없습니다.'});
                var list = [];
                rows.forEach(function(val) {
                    list.push(val.city);
                    if(list.length == rows.length) {
                        callback({result: true, msg: "구, 군 정보 가져옴", data: list});
                    }
                });
            });
        });
    }
};

module.exports = locate_model;