/**
 * @class Controllers.index
 */
var App = require("/core");

// Hold Window in global var
App.Win = $.wrapper;

// Open the window
App.Win.open();

// Init our app singleton
App.init();

// Load drugs and populate if empty
var _defaultDrugs = [
    {
        "drug": "Phenelzine",
        "dosage": "1 tablet after dinner"
    },
    {
        "drug": "Wellbutrin",
        "dosage": "1 tablet a day"
    }
];
var _drugs = Ti.App.Properties.getList("drugs", _defaultDrugs);

// schedule local notification for first drug added
var _notificationScheduled;

(function init() {
    $.version.text = "v" + Ti.App.version;
    // register for local notifications
    Ti.App.iOS.registerUserNotificationSettings({
	    types: [
            Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
            Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
            Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
        ]
    });

    populateTable();
})();

/**
 * populate drugs table
 */
function populateTable() {
    var rows = [];
    _drugs.forEach(function(drug, index){
        var row = Alloy.createController('row', {
            drug: drug.drug,
            dosage: drug.dosage,
            opacity: (0.5 / _drugs.length) * index
        });
        rows.push(row.getView());
    });
    $.table.setData(rows);
}

/**
 * add drug
 *
 * @param {Object} opts
 * @param {Object} opts.drugId  drug Rx number
 * @param {String} opts.drug    drug name
 * @param {Object} opts.dosage  dosage information
 */
function addDrug(opts) {
    _drugs.push(opts);
    Ti.App.Properties.setList("drugs", _drugs);
    populateTable();

    // schedule local notification to remind user
    if (!_notificationScheduled) {
        _notificationScheduled = true;
        var notification = Ti.App.iOS.scheduleLocalNotification({
            alertBody: "It is time to take one " + opts.drug + " tablet.",
            date: new Date(new Date().getTime() + 60000), // 60 seconds
        });
    }
}

/**
 * query drug
 *
 * present alert dialog if drug interacts with any already being taken
 *
 * @param {String} drug     drug name
 */
function queryDrug(drug) {
    var url = "https://1da90d062d84e88390354409afedadef8ec2a443.cloudapp-enterprise.appcelerator.com/api/interactions/" + drug + ".json";
    var client = Ti.Network.createHTTPClient({
        onload: function(e) {
            var resp = JSON.parse(this.responseText);
            resp.result.interactionPair.forEach(function(interactionPair){
                var interaction = _.findWhere(_drugs, {drug: interactionPair.interactionDetails.name});
                if (interaction) {
                    var dialog = Ti.UI.createAlertDialog({
                        message: drug + " is known to interact with " + interactionPair.interactionDetails.name + ". If you haven't already, please inform your doctor that you're taking these two drugs.",
                        title: "Warning"
                    });
                    dialog.show();
                }
            });
        },
        onerror: function(e) {
            Ti.API.error(JSON.stringify(e, null, 4));
        },
        timeout: 5000
    });
    client.open("GET", url);
    client.send();
}


/*******************************************/


/**
 * table delete row event handler
 */
$.table.addEventListener('delete', function _tableRowDelete(e){
    _drugs.splice(e.index, 1);
    setTimeout(populateTable, 500);
});

/**
 * add drug button click event handler
 */
$.add.addEventListener('click', function _addClick(e){
    Alloy.createController('add', {
        callback: function(e){
            Ti.API.debug('I got me a callback: ' + JSON.stringify(e));
            if (e.success) {
                addDrug(e);
                queryDrug(e.drug);
            }
        }
    });
});

/**
 * reset button click event handler
 */
$.resetButton.addEventListener('click', function _resetButtonClick(e){
    var dialog = Ti.UI.createAlertDialog({
        message: "Do you want to reset app data?",
        buttonNames: ['Cancel', 'Reset'],
        cancel: 0,
        destructive: 1,
        title: "Reset App"
    });
    dialog.addEventListener('click', function _alertClick(e){
        if (e.index === e.source.cancel){

        } else {
            _notificationScheduled = false;
            _drugs = _.clone(_defaultDrugs);
            Ti.App.Properties.setList("drugs", _drugs);
            Ti.API.debug("Reset default: " + JSON.stringify(_defaultDrugs, null, 4));
            Ti.API.debug("Reset drugs: " + JSON.stringify(_drugs, null, 4));
            populateTable();
        }
    });
    dialog.show();
});

/**
 * local notification event handler
 */
Ti.App.iOS.addEventListener('notification', function(e) {
    Ti.API.debug(e);
    var dialog = Ti.UI.createAlertDialog({
        message: e.alertBody,
        title: "Medication Due"
    });
    dialog.show();
});
