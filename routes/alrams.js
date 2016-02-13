/********************
 * ALRAMS PAGE
 ********************/

var express = require('express');
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

var router = express.Router();

/* GET clips list */
router.get('/', function(req, res, next) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'start_id': req.query.start_id,
            'amount': req.query.amount
        };

        if(data.amount == undefined) data.amount = 3;

        // 알림 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
            function(callback) {
                // 사용자 인증
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select = ['Users', data.access_token];
                    connection.query("SELECT users_id FROM ?? WHERE kakao_access_token = ?", select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "사용자 정보를 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, { users_id : rows[0].users_id });
                        } else {
                            callback({result: false, msg: '잘못된 접근입니다.'});
                        }
                    });
                });
            },
            function(back_data, callback) {
                // 알림 목록 가져옴
                pool.getConnection(function (err, connection) {
                    if (err) callback(err);
                    var select, sql;
                    if (data.start_id == undefined) {
                        select = [back_data.users_id, data.amount];
                        sql = "SELECT * FROM Alram WHERE alram_users_id = ? ORDER BY alramdate DESC LIMIT ?";
                    }
                    else {
                        select = [back_data.users_id, data.start_id, data.amount];
                        sql = "SELECT * FROM Alram WHERE alram_users_id = ? AND alram_id <= ? ORDER BY alramdate DESC LIMIT ?";
                    }
                    var query = connection.query(sql, select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return res.send({result: false, msg: "알림 목록을 가져오는데 실패했습니다. 원인: " + err});
                        }
                        connection.release();

                        if (rows.length != 0) {
                            callback(null, rows);
                        } else {
                            callback({result: false, msg: '알림 목록이 없습니다.'});
                        }
                    });
                    console.log(query);
                });
            }
            ], function(err, result) {
            // 알림 목록 출력
            if (err) return res.send(err);

            var dummy_data = {
                result: true,
                msg: "알림목록 가져옴",
                data: result
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });
    }
});

module.exports = router;
