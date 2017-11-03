# PlexusRx

PlexusRx is an Appcelerator Titanium app for iOS which demonstrates use of iOS 11 machine learning frameworks and OCR to detect and ingest information from a prescription pill bottle.

## Requirements

This project requires Xcode 9 with iOS 11 SDK and Titanium 6.2.x.

### Import the project

* Studio: File > Import... > Git > Git Repository as New Project
* CLI: Clone the repo then move to the project directory and run

        appc new --import --no-services

### Dependencies

#### Native modules

The following native modules are required and included in the project.

* [CoreML](https://github.com/hansemannn/titanium-coreml) - machine learning image object recognition
* [Vision](https://github.com/hansemannn/titanium-vision) - image text region detection
* [ImageFactory](https://github.com/appcelerator-modules/ti.imagefactory) - image transformation

#### CoreML model

The project requires a machine learning model to perform object recognition. The Inception v3 model is available from the Apple Developer site: https://developer.apple.com/machine-learning/ (direct download: https://docs-assets.developer.apple.com/coreml/models/Inceptionv3.mlmodel). The model needs to be compiled and added to the project:

* Compile the model:

        xcrun coremlcompiler compile path/to/model.mlmodel /path/to/Inceptionv3.mlmodel

* Copy `Inceptionv3.mlmodelc` directory to `assets/iphone` directory
* The model is referenced in the `add.js` controller file - ensure the name matches

#### Google Cloud Vision API

The [Google Cloud Vision API](https://cloud.google.com/vision/) is utilised for OCR and requires an API key. To register a project and enable the API open the [Google Cloud Platform console](https://console.cloud.google.com/) then

* Create a new project
* Enable the Vision API from the Services & APIs menu
* Copy the API key (see [Credentials](https://console.cloud.google.com/apis/credentials) menu) into `lib/gcp.js`

The project is now ready to run :)

## The app

The app presents a pre-populated list of medication - drug title and dosage. Tapping the + button at the bottom opens the image capture screen. There is a hidden button at the bottom-left of the screen which will reset the app.

### Image capture

The image capture screen has two modes

* recognising and processing pill bottle image labels (see [/drugs]() directory for source images to capture)
* general object recognition

You can toggle between these two modes by swiping up and down on the caemra image.

In pill bottle capture mode, point the camera at one of the pill bottle images ensuring it is as large as possible for optimum results. The capture frame is highlighted and the CAPTURE button is enabled. When the image is focussed, tap CAPTURE to begin the image capture process. First, text regions are highlighted in red then the label text is parsed for drug and dosage information. An alert is shown with the information found with the option to dismiss or add the drug.

### Drug interactions

Once drug information has been captured, an API request is made to an API Builder app which provides interaction information. If any interaction is found an alert is shown.

### Local notification

To demonstrate further usage, when the first drug is added a local notification is fired 60 seconds later which reminds the user that their medication is due.

## Legal Stuff

Appcelerator is a registered trademark of Appcelerator, Inc. Titanium is
a registered trademark of Appcelerator, Inc.  Please see the LEGAL information about using our trademarks,
privacy policy, terms of usage and other legal information at [http://www.appcelerator.com/legal](http://www.appcelerator.com/legal).
