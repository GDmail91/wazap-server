/********************
 * CONTESTS PAGE
 ********************/

var express = require('express');
var contests_model = require('../models/contests_model');
var users_model = require('../models/users_model');

var router = express.Router();

/* GET contests list */
router.get('/', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        if (req.query.amount == undefined) req.query.amount = 3;
        var data = {
            'access_token': req.query.access_token,
            'start_id': req.query.start_id,
            'amount': parseInt(req.query.amount)
        };

        // 모집공고 목록 가져옴 (메인)
        var async = require('async');
        async.waterfall([
            function(callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function(back_data, callback) {
                data.users_id = back_data.users_id;
                contests_model.get_contests_list(data, function (result) {
                    if (result.result) return callback(null, result);
                    callback(result);
                });
            }], function(err, result) {
                if (err) {
                    return res.send({ result: false, msg: err.msg });
                }
                res.statusCode = 200;
                res.send(result);
            });

    }
});

/* POST contest writing */
router.post('/', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'title': req.body.title,
            'recruitment': req.body.recruitment,
            'hosts': req.body.hosts,
            'categories': req.body.categories,
            'period': req.body.period,
            'cover': req.body.cover,
            'locate': req.body.locate,
            'positions': req.body.positions
        };

        // 글 작성 프로세스
        var async = require('async');
        async.waterfall([
                /*function(callback) {
                    // 유효성 검사
                    if (data.categories == undefined) data.categories = [];

                    var validation = /[a-힣]/;
                    var Validator = require('validator');
                    if(validation.test(data.access_token) // character only
                    && validation.test(data.title) // character only
                    && validation.test(data.hosts) // character only
                    && validation.test(data.cover)) // character only
                        callback({ result: false, msg: '데이터 타입이 잘못되었습니다.' });
                    else
                        callback(null);
                },*/
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // DB에 모집 데이터 저장
                    data.users_id = back_data.users_id;
                    contests_model.set_contests_recruit(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 게시 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "글작성 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET applies list */
router.get('/applications', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token
        };

        // 신청자 목록 가져오는 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 신청서 정보 확인
                    contests_model.get_application_info(back_data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                }
            ],
            function(err, result) {
                // 취소 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "신청목록 가져옴",
                    data: result
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* PUT finish the contest */
router.put('/finish/:contests_id', function(req, res) {
    var data = {
       'access_token': req.body.access_token,
       'contest_id': req.params.contests_id
    };

    // 지원서 마감하는 프로세스
    var async = require('async');
    async.waterfall([
            function(callback) {
                // 사용자 인증
                users_model.get_user_id(data, function(result) {
                    if (result.result) return callback(null, result.data);
                    else callback(result);
                });
            },
            function(back_data, callback) {
                data.users_id = back_data.users_id;
                // 게시글 권한 인증
                contests_model.is_contest_writer(data, function(result) {
                    if (result.result) return callback(null);
                    else callback(result);
                });
            },
            function(callback) {
                // 모집글 마감 설정
                contests_model.set_contests_finish(data, function(result) {
                    if (result.result) return callback(null, result);
                    else callback(result);
                });
            }
        ],
        function(err, result) {
            // 취소 결과 출력
            if (err) return res.send(err);
            var dummy_data = {
                result: true,
                msg: result.msg
            };
            res.statusCode = 200;
            res.send(dummy_data);
        });

});

/* GET users contests list */
router.get('/list/:writer_id', function(req, res) {
    var data = {
        'access_token': req.query.access_token,
        'writer_id': req.params.writer_id
    };

    // TODO 자기것 인지를 확인하는게 필요하다면 비교구문 추가함
    // 유저별 공모전 목록 가져오는 프로세스
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 해당 유저의 목록 가져옴
            contests_model.get_contests_list_by_writer(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        }
    ],
    function(err, result) {
        // 취소 결과 출력
        if (err) return res.send(err);
        var dummy_data = {
            result: true,
            msg: "모집한 목록 가져옴",
            data: result
        };
        res.statusCode = 200;
        res.send(dummy_data);
    });

});

/* GET contests detail view */
router.get('/:contest_id', function(req, res) {
    var data = {
        'access_token': req.query.access_token,
        'contest_id': req.params.contest_id
    };

    // 모집글 정보 가져옴
    var async = require('async');
    async.waterfall([
        function(callback) {
            // 사용자 인증
            users_model.get_user_id(data, function(result) {
                if (result.result) return callback(null, result.data);
                else callback(result);
            });
        },
        function(back_data, callback) {
            data.users_id = back_data.users_id;
            contests_model.get_contest_by_id(data, function (result) {
                if (result.result) return callback(null, result);
                callback(result);
            });
        }], function(err, result) {
        if (err) {
            return res.send({ result: false, msg: err.msg });
        }
        res.statusCode = 200;
        res.send(result);
    });
});

/* PUT contest editing */
router.put('/:contest_id', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id,
            'title': req.body.title,
            'recruitment': req.body.recruitment,
            'hosts': req.body.hosts,
            'categories': req.body.categories,
            'period': req.body.period,
            'cover': req.body.cover,
            'locate': req.body.locate,
            'positions': req.body.positions
        };

        // 글 수정 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    data.users_id = back_data.users_id;
                    contests_model.is_contest_writer(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                },
                function(callback) {
                    // DB에 모집 데이터 저장
                    contests_model.edit_contests_info(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 수정 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "수정 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* DELETE contests deleting */
router.delete('/:contest_id', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'contest_id': req.params.contest_id
        };

        // 글 삭제 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    data.users_id = back_data.users_id;
                    contests_model.is_contest_writer(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                },
                function(callback) {
                    // DB에서 글 삭제
                    contests_model.remove_contest(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 삭제 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "삭제 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET contests join form page */
router.get('/:contest_id/join', function(req, res, next) {
    // TODO duplicated
});

/* POST contests join process */
router.post('/:contest_id/join', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id
        };

        // 공모전 신청 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 게시글 존재 확인
                    data.users_id = back_data.users_id;
                    contests_model.get_contest_by_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(contests_info, callback) {
                    // 중복 신청 방지
                    contests_model.check_duplication(data, function(result) {
                        if (result.result) return callback(null, contests_info);
                        else callback(result);
                    });
                },
                function(contests_info, callback) {
                    // DB에 신청 데이터 저장
                    contests_model.apply_contest(data, function(result) {
                        if (result.result) return callback(null, contests_info);
                        else callback(result);
                    });
                },
                function(contests_info, callback) {
                    // 게시자에게 알림
                    var alrams_model = require('../models/alrams_model');
                    alrams_model.set_apply_alram(data.users_id, contests_info, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 게시 결과 출력
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "신청 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* GET contest appliers list */
router.get('/:contest_id/applies', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'contest_id': req.params.contest_id
        };

        // 공모전 신청서 목록 가져옴
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    data.users_id = back_data.users_id;
                    contests_model.is_contest_writer(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                },
                function(callback) {
                    // 신청서 목록 가져옴
                    contests_model.get_apply_list(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                }
            ],
            function(err, results) {
                // 신청서 목록 출력
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "신청자 목록 가져옴",
                    data : results
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* POST member adding */
router.post('/:contest_id/:applies_id', function(req, res) {
    if (!req.body.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.body.access_token,
            'contest_id': req.params.contest_id,
            'applies_id': req.params.applies_id
        };

        // 멤버 추가 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 게시글 권한 인증
                    data.users_id = back_data.users_id;
                    contests_model.is_contest_writer(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                },
                function( callback) {
                    // 신청서 정보 확인
                    contests_model.get_apply_info(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(applier_info, callback) {
                    // 신청서 승낙/거절
                    contests_model.accept_apply(data, function(result) {
                        if (result.result) return callback(null, result.data, applier_info);
                        else callback(result);
                    });
                },
                function(rows, applier_info, callback) {
                    // 신청자에게 알림
                    var alrams_model = require('../models/alrams_model');
                    alrams_model.set_member_add_alram(data.users_id, applier_info, function(result) {
                        if (result.result) return callback(null, rows);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 멤버 추가 결과
                if (err) return res.send(err);

                var dummy_data = {
                    result : true,
                    msg : "멤버 변경 완료"
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});

/* DELETE cancel apply */
router.delete('/:contest_id/join', function(req, res) {
    if (!req.query.access_token) {
        return res.send({
            result: false,
            msg: "로그인이 필요합니다."
        });
    } else {
        var data = {
            'access_token': req.query.access_token,
            'contest_id': req.params.contest_id,
            'applies_id': req.params.applies_id
        };

        // 신청서 삭제 프로세스
        var async = require('async');
        async.waterfall([
                function(callback) {
                    // 사용자 인증
                    users_model.get_user_id(data, function(result) {
                        if (result.result) return callback(null, result.data);
                        else callback(result);
                    });
                },
                function(back_data, callback) {
                    // 신청서 정보 확인
                    data.users_id = back_data.users_id;
                    contests_model.get_apply_info(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                },
                function(callback) {
                    // DB에서 신청서 삭제
                    contests_model.delete_from_apply(data, function(result) {
                        if (result.result) return callback(null);
                        else callback(result);
                    });
                }
            ],
            function(err) {
                // 취소 결과 출력
                if (err) return res.send(err);
                var dummy_data = {
                    result: true,
                    msg: "취소 되었습니다."
                };
                res.statusCode = 200;
                res.send(dummy_data);
            });
    }
});


module.exports = router;
