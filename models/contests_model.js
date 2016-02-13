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

var contests_model = {
    /**
     * Contests recently list (MAIN)
     * @param data (JSON) : start_id, amount
     */
    get_contests_list : function (data) {
        pool.getConnection(function (err, connection) {
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var select, sql;
            if (data.start_id == undefined) {
                select = [data.amount];
                sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests ORDER BY postdate DESC LIMIT ?";
            }
            else {
                select = [data.start_id, data.amount];
                sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id <= ? ORDER BY postdate DESC LIMIT ?";
            }

            connection.query(sql, select, function (err, rows) {
                if (err) {
                    connection.release();
                    return {result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: " + err};
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result: true,
                        msg: "모집글 목록 가져옴",
                        data: rows
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "모집글 정보가 없습니다."
                    };
                }
                return dummy_data;
            });
        });
    },

    /**
     * Post contest recruit infomation
     * @param data (JSON) : users_id, title, recruitment, hosts, categories, period, cover, positions
     */
    set_contests_recruit : function (data) {
        // DB에 모집 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
            }

            var insert = ['Contests',
                data.users_id,
                data.title,
                data.recruitment,
                data.hosts,
                data.categories,
                data.period,
                data.cover,
                data.positions];
            connection.query("INSERT INTO ?? SET " +
                "`cont_writer` = ?, " +
                "`title` = ?, " +
                "`recruitment` = ?, " +
                "`hosts` = ?, " +
                "`categories` = ?, " +
                "`period` = ?, " +
                "`cover` = ?, " +
                "`positions` = ?, " +
                "`postdate` = NOW()", insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: '저장 성공'};
            });
        });
    },

    /**
     * Get application informations
     * @param data (JSON) users_id
     */
    get_application_info : function (data) {
        // 신청서 정보 확인
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러발생. 원인: "+err };
            var select = ['Applies', data.users_id];
            connection.query("SELECT * FROM ?? WHERE app_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err };
                }

                if (rows.length != 0) {
                    return { result:true, msg: "신청서 정보 목록", data: rows };
                } else {
                    return { result: false, msg: '신청한 공고가 없습니다.' };
                }
            });
        });
    },

    /**
     * Get contest infomation
     * @param data (JSON) : contests_id (Array)
     */
    get_contest_info : function(data) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id IN (";

            // contests id 갯수만큼 where절에 추가하기
            var length = 0;
            data.forEach(function (val) {
                if(length == 0) sql += val.app_contests_id;
                else sql += "," + val.app_contests_id;
                length ++;
                if (length == data.length) {
                    sql += ")";

                    console.log(sql);
                    connection.query(sql, function (err, rows) {
                        if (err) {
                            connection.release();
                            return { result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err };
                        }
                        connection.release();

                        return { result: true, msg: "모집글 정보를 가져왔습니다.", data: rows };
                    });
                }
            });
        });
    },

    /**
     * Get contests list by writer id
     * @param data (JSON) : writer_id
     */
    get_contests_list_by_writer : function(data) {
        // 해당 유저의 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러발생. 원인: "+err };
            var select = [data.writer_id];
            connection.query("SELECT * FROM Contests WHERE cont_writer = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "게시글 정보 가져옴", data: rows };
                } else {
                    return { result: false, msg: '게시글이 없습니다.' };
                }
            });
        });
    },

    /**
     * Get contest by writer
     * @param data (JSON) : contests_id
     */
    get_contest_by_writer : function(data) {
        // 모집글 정보 가져옴
        pool.getConnection(function (err, connection) {
            var select = [data.contest_id];

            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            connection.query("SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "모집글 정보를 가져오는데 실패했습니다. 원인: "+err };
                }
                connection.release();

                var dummy_data;
                if (rows.length != 0) {
                    dummy_data = {
                        result : true,
                        msg : "상세 목록 가져옴",
                        data : rows[0]
                    };
                } else {
                    dummy_data = {
                        result: false,
                        msg: "모집글 정보가 없습니다."
                    };
                }
                return dummy_data;
            });
        });
    },

    /**
     * Authentication of contest
     * @param data (JSON) : contest_id, users_id
     */
    is_contest_writer : function(data) {
        // 게시글 권한 인증
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var select = [data.contest_id, data.users_id];
            connection.query("SELECT * FROM Contests WHERE contests_id = ? AND cont_writer = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "게시글 정보를 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "게시글에 대한 권한 확인"};
                } else {
                    return { result: false, msg: '수정 권한이 없습니다.' };
                }
            });
        });
    },

    /**
     * Edit contest infomation
     * @param data (JSON) : title, recrument, hosts, categories, period, cover, positions, contest_id
     */
    edit_contests_info : function(data) {
        // DB에 모집 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
            }

            var insert = ['Contests',
                data.title,
                data.recruitment,
                data.hosts,
                data.categories,
                data.period,
                data.cover,
                data.positions,
                data.contest_id];
            connection.query("UPDATE ?? SET " +
                "`title` = ?, " +
                "`recruitment` = ?, " +
                "`hosts` = ?, " +
                "`categories` = ?, " +
                "`period` = ?, " +
                "`cover` = ?, " +
                "`positions` = ?" +
                "WHERE contests_id = ?", insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: '수정하기 완료.' };
            });
        });
    },

    /**
     * Remove from contests table
     * @param data (JSON) : contest_id
     */
    remove_contest : function(data) {
        // DB에서 글 삭제
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
            }

            var select = ['Contests', data.contest_id];
            connection.query("DELETE FROM ?? WHERE contests_id = ?", select, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: '게시글 삭제 완료' };
            });
        });
    },

    /**
     * Check duplicate apply
     * @param data (JSON) : contest_id, users_id
     */
    check_duplication : function(data) {
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT * FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length == 0) {
                    return { result: true, msg: "중복값 없음" };
                } else {
                    return { result: false, msg: '이미 신청한 공고입니다.' };
                }
            });
        });
    },

    /**
     * Apply on contest
     * @param data (JSON) : contest_id, users_id
     */
    apply_contest : function(data) {
        // DB에 신청 데이터 저장
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
            }

            var insert = ['Applies', data.contest_id, data.users_id];

            connection.query("INSERT INTO ?? SET " +
                "`app_contests_id` = ?, " +
                "`app_users_id` = ?, " +
                "`postdate` = NOW()", insert, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: "신청 완료" };
            });
        });
    },

    /**
     * Get applies list
     * @param data (JSON) : contest_id, users_id
     */
    get_apply_list : function(data) {
        // 신청서 목록 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생 원인: "+err };
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT applies_id, app_users_id, postdate, is_check FROM ?? WHERE app_contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "신청서 목록 가져옴", data: rows };
                } else {
                    return { result: false, msg: '신청한 공고가 없습니다.' };
                }
            });
        });
    },

    /**
     * Get apply infomation
     * @param data (JSON) : contest_id, users_id
     */
    get_apply_info : function(data) {
        // 신청서 정보 가져옴
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("SELECT applies_id, app_users_id, postdate, is_check FROM ?? WHERE app_contests_id = ?", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "신청서 정보를 가져오는데 실패했습니다. 원인: " + err };
                }

                if (rows.length != 0) {
                    return { result: true, msg: "신청서 정보 가져옴", data: rows[0] };
                } else {
                    return { result: false, msg: '신청한 공고가 없습니다.' };
                }
            });
        });
    },

    /**
     * Accept or Defuse apply
     * @param data (JSON) : is_check, applies_id
     */
    accept_apply : function(data) {
        // 신청서 승낙/거절
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: " +err };
            var select = ['Applies', !data.is_check, data.applies_id];
            connection.query("UPDATE ?? SET " +
                "is_check = ? " +
                "WHERE applies_id = ? ", select, function (err, rows) {
                if (err) {
                    connection.release();
                    return { result: false, msg: "승낙하는데 실패했습니다. 원인: " + err };
                }
                connection.release();

                if (rows.length != 0) {
                    return { result: true, msg: "승낙 성공", data: rows };
                } else {
                    return { result: false, msg: '승낙할 신청서가 없습니다. '};
                }
            });
        });
    },

    /**
     * Delete from apply
     * @param data (JSON) : contest_id, users_id
     */
    delete_from_apply : function(data) {
        // DB에서 신청서 삭제
        pool.getConnection(function (err, connection) {
            if (err) {
                connection.release();
                return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
            }

            var select = ['Applies', data.contest_id, data.users_id];
            connection.query("DELETE FROM ?? WHERE app_contests_id = ? AND app_users_id = ?", select, function (err) {
                if (err) {
                    connection.release();
                    return { result: false, msg: '처리중 오류가 발생했습니다. 원인: ' + err };
                }
                connection.release();
                return { result: true, msg: "삭제 완료" };
            });
        });
    },

    /**
     * Get contests list index by array
     * @param data (JSON) : start_id, amount
     * @param arr (Array)
     */
    get_contests_by_array : function(data, arr) {
        // 각 모집글 별로 정보 검색
        pool.getConnection(function (err, connection) {
            if (err) return { result: false, msg: "에러 발생. 원인: "+err };
            // TODO members, appliers, clips, 가져오는 것 (JOIN 해야함)
            // TODO members 는 Applies테이블 중 is_check가 트루인 사람들, applier는 나머지 전부, clips 는 Clips 테이블중 contests_id를 가지고 있는것등
            var contests_list=  [];
            if (data.start_id == undefined) {
                contests_list = arr;
            }
            else {
                arr.forEach(function (val, index) {
                    if (val.cli_contests_id <= data.start_id) {
                        contests_list[index] = { cli_contests_id: val.cli_contests_id };
                    }
                });
            }

            var select = [data.amount];
            var sql = "SELECT contests_id, title, recruitment, cont_writer, hosts, categories, period, cover, positions, views FROM Contests WHERE contests_id IN (";

            // contests id 갯수만큼 where절에 추가하기
            var length = 0;
            contests_list.forEach(function (val) {
                if(length == 0) sql += val.cli_contests_id;
                else sql += "," + val.cli_contests_id;
                length ++;
                if (length == contests_list.length) {
                    sql += ") ORDER BY postdate DESC LIMIT ?";

                    connection.query(sql, select, function (err, rows) {
                        if (err) {
                            connection.release();
                            return { result: false, msg: "찜 목록 정보를 가져오는데 실패했습니다. 원인: "+err };
                        }
                        connection.release();

                        return { result: true, msg: "찜 목록 가져옴", data: rows };
                    });
                }
            });
        });
    }
};

module.exports = contests_model;