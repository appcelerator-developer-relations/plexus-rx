/**
 * Google Cloud Platform helper
 *
 * @class gcm
 */

var http = require('/http');

var GCP_API_BASE_URL = 'https://vision.googleapis.com/v1/',
    GCP_API_KEY = ''; // <-- Your Google Cloud Platform API key

/**
 * Image annotate request
 * https://cloud.google.com/vision/docs/detecting-fulltext
 *
 * @param {Object} _params The arguments for the method
 * @param {Number} _params.image Image blob
 * @param {String} _params.type Type of request, e.g. "DOCUMENT_TEXT_DETECTION"
 * @param {String} _params.callback Callack
 */
exports.imageAnnotate = function(params) {

    if (!GCP_API_KEY || GCP_API_KEY.length == 0) {
        Ti.API.error('Please set your Google Cloud Platform API key in /app/lib/gcm.js');
        if (params.callback) {
            params.callback({
                success: false,
                error: 'Google Cloud Platform API key required'
            });
        }
        return;
    }

    // get base64 string from image data and remove carriage returns
    var imageData = Ti.Utils.base64encode(params.image).text.replace(/\r\n|\n|\r/g,'');

    http.request({
        type: 'POST',
        url: GCP_API_BASE_URL + 'images:annotate?key=' + GCP_API_KEY,
        format: 'JSON',
        headers: [{
            name: 'Content-Type',
            value: 'application/json'
        }],
        data: {
            "requests": [
                {
                    "image": {
                        "content": imageData
                    },
                    "features": [
                        {
                            "type": "DOCUMENT_TEXT_DETECTION"
                        }
                    ]
                }
            ]
        },
        success: function(data){
            // Ti.API.info('GCP image annotate request success: ' + JSON.stringify(data, null, 4));
            if (params.callback) {
                params.callback({
                    success: true,
                    text: data.responses[0].textAnnotations[0].description
                });
            }
        },
        failure: function(e){
            Ti.API.error('GCP image annotate request failed: ' + JSON.stringify(e, null, 4));
        }
    });
};
