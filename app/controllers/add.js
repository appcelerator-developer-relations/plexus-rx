var GCP = require('/gcp'),
    CoreML = require('ti.coreml'),
    Vision = require('ti.vision'),
    ImageFactory = require('ti.imagefactory');

var _recognitionView,
    _callback = arguments[0].callback,
    _foundTimeout = 10,
    _showObservations;

String.prototype.toTitleCase = function () {
    return this.charAt(0).toUpperCase() + this.substr(1).toLowerCase();
};

/**
 * init
 */
(function init(){
    _recognitionView = CoreML.createRealtimeRecognitionView({
        model: 'Inceptionv3.mlmodelc',
        top: 0,
        width: Ti.UI.FILL,
        height: Ti.UI.FILL
    });
    _recognitionView.addEventListener('classification', handleRecognition)
    $.imageCapture.add(_recognitionView);
    _recognitionView.startRecognition();
    $.resultView.hide();

    $.window.open();
})();

/**
 * handle CoreML recognition
 *
 * @param {Object} e
 */
function handleRecognition(e) {
    var classifications = e.classifications;
    var numClassifications = Math.min(classifications.length, 10);
    var found = false;

    for (var i=0; i<numClassifications; i++) {
        var classification = classifications[i];
        var identifier = classification.identifier;
        var confidence = classification.confidence;
        if (identifier.indexOf('pill') !== -1 && confidence > 0.7) {
            Ti.API.info('Pill-bottle found! (' + identifier + ' / ' + confidence * 100 + ' %)');
            found = true;
        }
    }

    if (found) {
        $.captureOverlay.opacity = 1.0;
        $.captureButton.opacity = 1.0;
        $.captureButton.touchEnabled = true;
        _foundTimeout = 10;
    } else {
        _foundTimeout--;
        if (_foundTimeout <= 0) {
            $.captureOverlay.opacity = 0.3;
            $.captureButton.opacity = 0.3;
            $.captureButton.touchEnabled = false;
        }
    }

    if (_showObservations) {
        numClassifications = Math.min(classifications.length, 3);
        for (var i=0; i<numClassifications; i++) {
            var classification = classifications[i];
            var identifier = classification.identifier;
            var confidence = classification.confidence;

            var confidenceLabel = $['observation' + (i+1) + 'Confidence'];
            var identifierLabel = $['observation' + (i+1) + 'Identifier'];

            confidenceLabel.text = Math.round(confidence * 100) + '%';
            identifierLabel.text = identifier;

            if (confidence > 0.9) {
                confidenceLabel.color = '#00dd00';
            } else {
                confidenceLabel.color = '#aaa';
            }
        }
    }
}

/**
 * detect and overlay text rectangles from image
 *
 * @param {TiBlob} image
 */
function detectTextRectangles(image) {
    Vision.detectTextRectangles({
        image: image,
        callback: function(e) {
            if (!e.success) {
                Ti.API.error(e.error);
            }

            e.observations.forEach(function(observation){
                $.resultView.add(Ti.UI.createView({
                    // image processed and image displayed are rotated 90degrees
                    top: (observation.boundingBox.x * 100) + '%',
                    left: (observation.boundingBox.y * 100) + '%',
                    width: (observation.boundingBox.height * 100) + '%',
                    height: (observation.boundingBox.width * 100) + '%',
                    backgroundColor: 'transparent',
                    borderColor: 'red',
                    borderWidth: 2
                }));
            });

            captureDrugInfo(image);
        }
    });
}

/**
 * capture drug information from image
 *
 * @param {TiBlob} image
 */
function captureDrugInfo(image) {
    GCP.imageAnnotate({
        image: ImageFactory.imageAsResized(image, { width:image.width/2, height:image.height/2, quality:ImageFactory.QUALITY_HIGH}),
        callback: function(e){
            if (!e.success) {
                Ti.API.error(JSON.stringify(e, null, 4));
                return;
            }

            // parse text for drug information
            var drugIdMatches = e.text.match(/RX:\s?([0-9]*)/),
                drugMatches = e.text.match(/DRUG:\s?([a-zA-Z]*)/i),
                dosageMatches = e.text.match(/TAKE\s?([a-zA-Z0-9\s]*(DAY|AST|NCH|NER|ING))/i),
                drugId = '-',
                drug = '-',
                dosage = '-';

            if (drugIdMatches && drugIdMatches.length > 1) {
                drugId = drugIdMatches[1];
            }

            if (drugMatches && drugMatches.length > 1) {
                drug = drugMatches[1].toTitleCase();
            }

            if (dosageMatches && dosageMatches.length > 0) {
                dosage = dosageMatches[1].toTitleCase();
            }

            var dialog = Ti.UI.createAlertDialog({
                message: drug + '\n' + dosage + '\n\nWould you like to add this to your cabinet?',
                buttonNames: ['Dismiss', 'Add'],
                cancel: 0,
                title: 'New drug found'
            });
            dialog.addEventListener('click', function _alertClick(e){
                if (e.index != e.source.cancel){
                    _callback({
                        success: true,
                        drug: drug,
                        dosage: dosage
                    });
                }
                $.window.close();
            });
            dialog.show();
        }
    });
}


/*******************************************/


/**
 * capture button click event handler
 */
$.captureButton.addEventListener('click', function _captureButtonClick(e){

    $.captureButton.text = 'CAPTURING...';
    $.captureButton.backgroundColor = '#dd0000';
    $.captureButton.touchEnabled = false;

    $.captureFlash.show();
    var animation = Ti.UI.createAnimation({
        duration: 500,
        opacity: 0
    });
    animation.addEventListener('complete', function _captureFlashAnimationComplete(e){
        $.captureFlash.hide();
    });
    $.captureFlash.animate(animation);

    _recognitionView.takePicture(function(e) {
        _recognitionView.stopRecognition();
        _recognitionView.hide();
        $.resultView.setImage(ImageFactory.imageWithRotation(e.image, {degrees: 90}));
        $.resultView.show();
        detectTextRectangles(e.image);
    });
});

/**
 * close button click event handler
 */
$.closeButton.addEventListener('click', function _closeButtonClick(e){
    if (_recognitionView.isRecognizing()) {
        _recognitionView.stopRecognition();
    }
    $.window.close();
});

/**
 * image capture container swipe event handler
 *
 * toggle observations overlay
 */
$.imageCaptureContainer.addEventListener('swipe', function _imageCaptureContainerSwipe(e){
    if (e.direction == 'up') {
        $.captureOverlay.hide();
        $.captureButton.hide();
        $.observationsOverlay.show();
        _showObservations = true;
    } else if (e.direction == 'down') {
        $.captureOverlay.show();
        $.captureButton.show();
        $.observationsOverlay.hide();
        _showObservations = false;
    }
});
