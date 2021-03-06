var credentials = require('../credentials');
var mysql = require('mysql');
var pool = mysql.createPool({
    host    : credentials.mysql.host,
    port : credentials.mysql.port,
    user : credentials.mysql.user,
    password : credentials.mysql.password,
    database: credentials.mysql.database,
    connectionLimit: 21,
    waitForConnections: false
});

var users_model = {
    /**
     * Update users infomation, input user infomation data
     * @param data (JSON) : kakao_id, username, school, age, major, locate, introduce, exp, access_token
     * @param callback (Function)
     */
    update_info : function (data, callback) {
        // user 정보 수정
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "에러 발생. 원인: "+err });
            var insert = [data.kakao_id, data.username, data.school, data.age, data.major, data.skill, data.locate, data.introduce, data.exp, data.access_token];
            connection.query('UPDATE Users SET ' +
                '`kakao_id` = ?, ' +
                '`username` = ?, ' +
                '`school` = ?, ' +
                '`age` =?, ' +
                '`major` = ?, ' +
                '`skill` = ?, ' +
                '`locate` = ?, ' +
                '`introduce` = ?, ' +
                '`exp` = ? WHERE facebook_access_token= ?', insert, function (err, rows) {
                if (err) {
                    return callback({ result: false, msg: "정보 수정에 실패했습니다. 원인: "+err });
                } else if(rows.affectedRows == 0) {
                    return callback({ result: false, msg: "정보 수정에 실패했습니다. 원인: 적용되지않음" });
                }
                connection.release();

                var dummy_data = {
                    result : true,
                    msg : "정보 수정에 성공했습니다."
                };
                return callback(dummy_data);
            });
        });
    },
    /**
     * Authentication of user
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    auth_user : function (data, callback) {
        // login 정보 확인
        pool.getConnection(function (err, connection) {
            var select = [data.access_token];
            connection.query("SELECT * FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "인증에 성공했습니다."
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "인증에 실패했습니다."
                    };
                }
                return callback(dummy_data);
            });
        });
    },

    /**
     * Getting user data
     * @param data (JSON) : user_id
     * @param callback (Function)
     */
    get_user : function(data, callback) {
        // 사용자 정보 가져옴
        pool.getConnection(function (err, connection) {
            var select = [data.user_id];

            connection.query("SELECT users_id, username, profile_img, major, skill, school, locate, kakao_id, introduce, exp, age FROM Users WHERE users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: "+err });
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "사용자 정보 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "사용자 정보가 없습니다."
                    };
                }
                return callback(dummy_data);
            });
        });
    },

    /**
     * Get user id
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    get_user_id : function (data, callback) {
        // 사용자 인증
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
            var select = [data.access_token];
            connection.query("SELECT users_id FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();

                if (rows.length != 0) {
                    return callback({ result: true, msg: "사용자 정보 가져왔습니다.", data: { users_id : rows[0].users_id }});
                } else {
                    return callback({ result: false, msg: '잘못된 접근입니다.'});
                }
            });
        });
    },

    /**
     * Get user name by id (array)
     * @param data (JSON Array) users_id
     * @param callback
     */
    get_user_name : function(data, callback) {
        // 사용자 이름 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});

            var sql = "SELECT username FROM Users WHERE facebook_access_token IN (";

            // 선택한 사용자 ID 갯수만큼 WHERE절에 추가
            var length = 0;
            data.forEach(function (val) {
                if(length == 0) sql += val.users_id;
                else sql += "," + val.users_id;
                length ++;
                if (length == data.length) {
                    sql += ")";

                    connection.query(sql, function (err, rows) {
                        if (err) {
                            connection.release();
                            return callback({ result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            return callback({ result: true, msg: "사용자 정보 가져왔습니다.", data: { usersname : rows[0].username }});
                        } else {
                            return callback({ result: false, msg: '사용자 정보가 없습니다.'});
                        }
                    });
                }
            });
        });
    },

    /**
     * Check whether admin or not
     * @param data (JSON) : access_token
     * @param callback (Function)
     */
    get_admin_id : function (data, callback) {
        // 관리자 인증
        pool.getConnection(function (err, connection) {
            if (err) return callback({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
            var select = [data.access_token];
            connection.query("SELECT users_id, admin FROM Users WHERE facebook_access_token = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return callback({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                }
                connection.release();
                if (rows.length != 0) {
                    if (rows[0].admin) {
                        return callback({result: true, msg: "사용자 정보 가져왔습니다.", data: {users_id: rows[0].users_id}});
                    }

                }
                return callback({result: false, msg: '잘못된 접근입니다.'});
            });
        });
    }
};

module.exports = users_model;