/**
 * Created by YS on 2016-06-24.
 */
var firebase = require("firebase");
var request = require('request');
var credentials = require("../credentials.js");

module.exports = function(user_id, message, callback) {
    var fcm_data = {
        to: "/topics/"+user_id,
        data: {
            message: message
        }
    };

    request.post({
        url: credentials.fcm_url,
        json: fcm_data,
        headers: {
            "Authorization": "key="+ credentials.fcm_server_key
        }
    }, function(err, httpResponse, body) {
        console.log(body);
        callback(err, httpResponse, body);
    });
};