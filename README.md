## Project Oxford for Node.js
[![npm version](https://badge.fury.io/js/project-oxford.svg)](http://badge.fury.io/js/project-oxford)
[![Build Status](https://travis-ci.org/felixrieseberg/project-oxford.svg?branch=master)](https://travis-ci.org/felixrieseberg/project-oxford)

This package contains a set of intelligent APIs understanding images: It can detect and analyze people's faces, their age, gender, and similarity. It can identify people based on a set of images. It can understand what is displayed in a picture and crop it according to where the important features are. It can tell you whether an image contains adult content, what the main colors are, and which of your images belong in a group. If your image features text, it will tell you the language and return the text as a string. It's basically magic. For more details on the Project Oxford API, please visit [projectoxford.ai](http://www.projectoxford.ai/demo/face#detection).

This Node module implements all APIs available in the Face and Vision APIs of Project Oxford.

![](https://i.imgur.com/Zrsnhd3.jpg)

## Usage
To install this package, run `npm install --save project-oxford` [and obtain an API key](http://www.projectoxford.ai/doc/general/subscription-key-mgmt). To obtain such a key, [you will also need an (free) Microsoft Azure Account](http://www.azure.com). Once you got your key, you can instantiate an Oxford client in your code:

```
var oxford = require('project-oxford'),
    client = new oxford.Client('7fb073s72bh72663y5ddh129m12e598d');
```

Now that you got your client running, you're ready to do some pretty smart stuff. Have a picture of a person and want a computed guess of their age and gender?

```
client.face.detect({
    path: 'myFolder/myFace.jpg',
    analyzesAge: true,
    analyzesGender: true
}).then(function (response) {
    console.log('The age is: ' + response[0].attributes.age);
    console.log('The gender is: ' + response[0].attributes.gender);
});
```
Have a picture of a person and want a computed guess about their emotions?

```
client.emotion.analyzeEmotion({
    path: './myFace.jpg',
}).then(function (response) {
    console.log(response);
});
```
Or, you can add the rectangle of the face yourself, in the form "left,top,width,height". Delimited multiple face rectangles with a “;”.

```
client.emotion.analyzeEmotion({
    path: './myFace.jpg',
    faceRectangles: '10, 10, 100, 100'
}).then(function (response) {
    console.log(response);
});
```
Creating a smart-cropped thumbnail:
```
client.vision.thumbnail({
    path: './photo.jpg',
    height: 150,
    width: 150,
    smartCropping: true,
    pipe: fs.createWriteStream('./photo2.jpg')
});
```

Running OCR on an image, returning the text on the image:
```
visionClient.vision.ocr({
    path: './test/images/ocr.jpg',
    language: 'en'
}).then(function (response) {
    console.log(response.body);
});
```

For the full documentation, please see the API reference below.

## API Reference
* [Client](#Client)
  * [new Client(key)](#new_Client_new)
  * [.face](#Client.face) : <code>object</code>
    * [.detect(options)](#Client.face..detect) ⇒ <code>Promise</code>
    * [.similar(sourceFace, candidateFaces)](#Client.face..similar) ⇒ <code>Promise</code>
    * [.grouping(faces)](#Client.face..grouping) ⇒ <code>Promise</code>
    * [.identify(faces)](#Client.face..identify) ⇒ <code>Promise</code>
    * [.verify(faces)](#Client.face..verify) ⇒ <code>Promise</code>
  * [.vision](#Client.vision) : <code>object</code>
    * [.analyzeImage(options)](#Client.vision..analyzeImage) ⇒ <code>Promise</code>
    * [.thumbnail(options)](#Client.vision..thumbnail) ⇒ <code>Promise</code>
    * [.ocr(options)](#Client.vision..ocr) ⇒ <code>Promise</code>

<a name="new_Client_new"></a>
### new Client(key)
Creates a new Project Oxford Client using a given API key.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Project Oxford API Key |

<a name="Client.face"></a>
### Client.face : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.face](#Client.face) : <code>object</code>
  * [~detect(options)](#Client.face..detect) ⇒ <code>Promise</code>
  * [~similar(sourceFace, candidateFaces)](#Client.face..similar) ⇒ <code>Promise</code>
  * [~grouping(faces)](#Client.face..grouping) ⇒ <code>Promise</code>
  * [~identify(faces)](#Client.face..identify) ⇒ <code>Promise</code>
  * [~verify(faces)](#Client.face..verify) ⇒ <code>Promise</code>

<a name="Client.face..detect"></a>
#### face.detect(options) ⇒ <code>Promise</code>
Call the Face Detected API
Detects human faces in an image and returns face locations, face landmarks, and
optional attributes including head-pose, gender, and age. Detection is an essential
API that provides faceId to other APIs like Identification, Verification,
and Find Similar.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to image to be used |
| options.path | <code>string</code> | Path to image to be used |
| options.stream | <code>stream</code> | Stream for image to be used |
| options.analyzesFaceLandmarks | <code>boolean</code> | Analyze face landmarks? |
| options.analyzesAge | <code>boolean</code> | Analyze age? |
| options.analyzesGender | <code>boolean</code> | Analyze gender? |
| options.analyzesHeadPose | <code>boolean</code> | Analyze headpose? |

<a name="Client.face..similar"></a>
#### face.similar(sourceFace, candidateFaces) ⇒ <code>Promise</code>
Detect similar faces using faceIds (as returned from the detect API)

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| sourceFace | <code>string</code> | String of faceId for the source face |
| candidateFaces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use as candidates |

<a name="Client.face..grouping"></a>
#### face.grouping(faces) ⇒ <code>Promise</code>
Divides candidate faces into groups based on face similarity using faceIds.
The output is one or more disjointed face groups and a MessyGroup.
A face group contains the faces that have similar looking, often of the same person.
There will be one or more face groups ranked by group size, i.e. number of face.
Faces belonging to the same person might be split into several groups in the result.
The MessyGroup is a special face group that each face is not similar to any other
faces in original candidate faces. The messyGroup will not appear in the result if
all faces found their similar counterparts. The candidate face list has a
limit of 100 faces.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use |

<a name="Client.face..identify"></a>
#### face.identify(faces) ⇒ <code>Promise</code>
Identifies persons from a person group by one or more input faces.
To recognize which person a face belongs to, Face Identification needs a person group
that contains number of persons. Each person contains one or more faces. After a person
group prepared, it should be trained to make it ready for identification. Then the
identification API compares the input face to those persons' faces in person group and
returns the best-matched candidate persons, ranked by confidence.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use |

<a name="Client.face..verify"></a>
#### face.verify(faces) ⇒ <code>Promise</code>
Analyzes two faces and determine whether they are from the same person.
Verification works well for frontal and near-frontal faces.
For the scenarios that are sensitive to accuracy please use with own judgment.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array containing two faceIds to use |

<a name="Client.vision"></a>
### Client.vision : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.vision](#Client.vision) : <code>object</code>
  * [~analyzeImage(options)](#Client.vision..analyzeImage) ⇒ <code>Promise</code>
  * [~thumbnail(options)](#Client.vision..thumbnail) ⇒ <code>Promise</code>
  * [~ocr(options)](#Client.vision..ocr) ⇒ <code>Promise</code>

<a name="Client.vision..analyzeImage"></a>
#### vision.analyzeImage(options) ⇒ <code>Promise</code>
This operation does a deep analysis on the given image and then extracts a
set of rich visual features based on the image content.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |
| options.ImageType | <code>boolean</code> | Detects if image is clipart or a line drawing. |
| options.Color | <code>boolean</code> | Determines the accent color, dominant color, if image is black&white. |
| options.Faces | <code>boolean</code> | Detects if faces are present. If present, generate coordinates, gender and age. |
| options.Adult | <code>boolean</code> | Detects if image is pornographic in nature (nudity or sex act). Sexually suggestive content is also detected. |
| options.Categories | <code>boolean</code> | Image categorization; taxonomy defined in documentation. |

<a name="Client.vision..thumbnail"></a>
#### vision.thumbnail(options) ⇒ <code>Promise</code>
Generate a thumbnail image to the user-specified width and height. By default, the
service analyzes the image, identifies the region of interest (ROI), and generates
smart crop coordinates based on the ROI. Smart cropping is designed to help when you
specify an aspect ratio that differs from the input image.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be thumbnailed |
| options.path | <code>string</code> | Path to image to be thumbnailed |
| options.width | <code>number</code> | Width of the thumb in pixels |
| options.height | <code>number</code> | Height of the thumb in pixels |
| options.smartCropping | <code>boolean</code> | Should SmartCropping be enabled? |
| options.pipe | <code>Object</code> | We'll pipe the returned image to this object |

<a name="Client.vision..ocr"></a>
#### vision.ocr(options) ⇒ <code>Promise</code>
Optical Character Recognition (OCR) detects text in an image and extracts the recognized
characters into a machine-usable character stream.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |
| options.language | <code>string</code> | BCP-47 language code of the text to be detected in the image. Default value is "unk", then the service will auto detect the language of the text in the image. |
| options.detectOrientation | <code>string</code> | Detect orientation of text in the image |


<a name="Client.emotion"></a>
### Client.emotion : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>

* [.emotion](#Client.emotion) : <code>object</code>
  * [~analyzeEmotion(options)](#Client.emotion..analyzeImage) ⇒ <code>Promise</code>

<a name="Client.emotion..analyzeEmotion"></a>
#### emotion.analyzeEmotion(options) ⇒ <code>Promise</code>
Recognizes the emotions expressed by one or more people in an image,
as well as returns a bounding box for the face.
The emotions detected are happiness, sadness, surprise, anger, fear, contempt, and disgust or neutral.

**Returns**: <code>Promise</code> - Promise resolving with the resulting JSON

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |
| options.faceRectangles | <code>string (optional)</code> | A face rectangle is in the form “left,top,width,height”. Delimited multiple face rectangles with a “;”. |

## License
Licensed as MIT - please see LICENSE for details.
