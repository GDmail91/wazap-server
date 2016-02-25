/********************
 * WAZAP SCHEDULING
 ********************/

var contests_model = require('./models/contests_model');

var wazap_schedule = {
    on : function() {
        var schedule = require('node-schedule');
        schedule.scheduleJob({hour: 1, minute: 17}, function() {
            // finishing contests at the day
            contests_model.get_contests_and_finishing(function(result) {
                if (result.result) return console.log('Today contests finished');
                else return console.error('Failed to Today contests finish');
            });
        });
    }
};

module.exports = wazap_schedule;