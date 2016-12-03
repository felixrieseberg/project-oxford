## Project Oxford for Node.js
[![npm version](https://badge.fury.io/js/project-oxford.svg)](http://badge.fury.io/js/project-oxford)

This package contains a set of intelligent APIs understanding images: It can detect and analyze people's faces, their age, gender, and similarity. It can identify people based on a set of images. It can understand what is displayed in a picture and crop it according to where the important features are. It can tell you whether an image contains adult content, what the main colors are, and which of your images belong in a group. If your image features text, it will tell you the language and return the text as a string. It's basically magic. For more details on the Project Oxford API, please visit [projectoxford.ai](http://www.projectoxford.ai/demo/face#detection).

This Node module implements Project Oxford's API for Faces, Vision, Text, Video, and WebLM.

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
client.vision.ocr({
    path: './test/images/ocr.jpg',
    language: 'en'
}).then(function (response) {
    console.log(response.body);
});
```

For the full documentation, please see the API reference below.

## API Reference
<a name="Client"></a>

## Client
**Kind**: global class  

* [Client](#Client)
    * [new Client(key, host)](#new_Client_new)
    * [.emotion](#Client.emotion) : <code>object</code>
        * [~analyzeEmotion(options)](#Client.emotion..analyzeEmotion) ⇒ <code>Promise</code>
    * [.face](#Client.face) : <code>object</code>
        * _static_
            * [.faceList](#Client.face.faceList) : <code>object</code>
                * [.list()](#Client.face.faceList.list) ⇒ <code>Promise</code>
                * [.create(faceListId, options)](#Client.face.faceList.create) ⇒ <code>Promise</code>
                * [.update(faceListId, options)](#Client.face.faceList.update) ⇒ <code>Promise</code>
                * [.delete(faceListId)](#Client.face.faceList.delete) ⇒ <code>Promise</code>
                * [.get(faceListId)](#Client.face.faceList.get) ⇒ <code>Promise</code>
                * [.addFace(faceListId, options)](#Client.face.faceList.addFace) ⇒ <code>Promise</code>
                * [.deleteFace(faceListId, persistedFaceId)](#Client.face.faceList.deleteFace) ⇒ <code>Promise</code>
            * [.personGroup](#Client.face.personGroup) : <code>object</code>
                * [.create(personGroupId, name, userData)](#Client.face.personGroup.create) ⇒ <code>Promise</code>
                * [.delete(personGroupId)](#Client.face.personGroup.delete) ⇒ <code>Promise</code>
                * [.get(personGroupId)](#Client.face.personGroup.get) ⇒ <code>Promise</code>
                * [.trainingStatus(personGroupId)](#Client.face.personGroup.trainingStatus) ⇒ <code>Promise</code>
                * [.trainingStart(personGroupId)](#Client.face.personGroup.trainingStart) ⇒ <code>Promise</code>
                * [.update(personGroupId, name, userData)](#Client.face.personGroup.update) ⇒ <code>Promise</code>
                * [.list()](#Client.face.personGroup.list) ⇒ <code>Promise</code>
            * [.person](#Client.face.person) : <code>object</code>
                * [.addFace(personGroupId, personId, options)](#Client.face.person.addFace) ⇒ <code>Promise</code>
                * [.deleteFace(personGroupId, personId, persistedFaceId)](#Client.face.person.deleteFace) ⇒ <code>Promise</code>
                * [.updateFace(personGroupId, personId, persistedFaceId, userData)](#Client.face.person.updateFace) ⇒ <code>Promise</code>
                * [.getFace(personGroupId, personId, persistedFaceId)](#Client.face.person.getFace) ⇒ <code>Promise</code>
                * [.create(personGroupId, name, userData)](#Client.face.person.create) ⇒ <code>Promise</code>
                * [.delete(personGroupId, personId)](#Client.face.person.delete) ⇒ <code>Promise</code>
                * [.get(personGroupId, personId)](#Client.face.person.get) ⇒ <code>Promise</code>
                * [.update(personGroupId, name, userData)](#Client.face.person.update) ⇒ <code>Promise</code>
                * [.list(personGroupId)](#Client.face.person.list) ⇒ <code>Promise</code>
        * _inner_
            * [~detect(options)](#Client.face..detect) ⇒ <code>Promise</code>
            * [~similar(sourceFace, options)](#Client.face..similar) ⇒ <code>Promise</code>
            * [~grouping(faces)](#Client.face..grouping) ⇒ <code>Promise</code>
            * [~identify(faces, personGroupId, maxNumOfCandidatesReturned)](#Client.face..identify) ⇒ <code>Promise</code>
            * [~verify(faces)](#Client.face..verify) ⇒ <code>Promise</code>
    * [.text](#Client.text) : <code>object</code>
        * [~proof(text, preContextText, postContextText)](#Client.text..proof) ⇒ <code>Promise</code>
        * [~spellCheck(text, preContextText, postContextText)](#Client.text..spellCheck) ⇒ <code>Promise</code>
    * [.video](#Client.video) : <code>object</code>
        * _static_
            * [.result](#Client.video.result)
                * [.get(operation)](#Client.video.result.get) ⇒ <code>Promise</code>
                * [.getVideo(url, pipe)](#Client.video.result.getVideo) ⇒ <code>Promise</code>
        * _inner_
            * [~trackFace(options)](#Client.video..trackFace) ⇒ <code>Promise</code>
            * [~detectMotion(options)](#Client.video..detectMotion) ⇒ <code>Promise</code>
            * [~stabilize(options)](#Client.video..stabilize) ⇒ <code>Promise</code>
    * [.vision](#Client.vision) : <code>object</code>
        * _static_
            * [.models](#Client.vision.models) : <code>object</code>
                * [.list()](#Client.vision.models.list) ⇒ <code>Promise</code>
                * [.analyzeImage(model, options)](#Client.vision.models.analyzeImage) ⇒ <code>Promise</code>
        * _inner_
            * [~analyzeImage(options)](#Client.vision..analyzeImage) ⇒ <code>Promise</code>
            * [~thumbnail(options)](#Client.vision..thumbnail) ⇒ <code>Promise</code>
            * [~ocr(options)](#Client.vision..ocr) ⇒ <code>Promise</code>
    * [.weblm](#Client.weblm) : <code>object</code>
        * [~listModels()](#Client.weblm..listModels) ⇒ <code>Promise</code>
        * [~breakIntoWords(model, text, options)](#Client.weblm..breakIntoWords) ⇒ <code>Promise</code>
        * [~generateWords(model, words, options)](#Client.weblm..generateWords) ⇒ <code>Promise</code>
        * [~getJointProbabilities(model, phrases, order)](#Client.weblm..getJointProbabilities) ⇒ <code>Promise</code>
        * [~getConditionalProbabilities(model, queries, order)](#Client.weblm..getConditionalProbabilities) ⇒ <code>Promise</code>

<a name="new_Client_new"></a>

### new Client(key, host)
Creates a new Project Oxford Client using a given API key.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | Project Oxford API Key |
| host | <code>string</code> | Optional host address |

<a name="Client.emotion"></a>

### Client.emotion : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  
<a name="Client.emotion..analyzeEmotion"></a>

#### emotion~analyzeEmotion(options) ⇒ <code>Promise</code>
Analyze the emotions of one or more faces in an image.

**Kind**: inner method of <code>[emotion](#Client.emotion)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object |
| options.url | <code>string</code> | URL to the image file |
| options.path | <code>string</code> | URL to a local image file |
| options.data | <code>string</code> | Image as a binary buffer |
| options.faceRectangles | <code>Array.&lt;Object&gt;</code> | Array of face rectangles.  Face rectangles      are returned in the face.detect and vision.analyzeImage methods. |

<a name="Client.face"></a>

### Client.face : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.face](#Client.face) : <code>object</code>
    * _static_
        * [.faceList](#Client.face.faceList) : <code>object</code>
            * [.list()](#Client.face.faceList.list) ⇒ <code>Promise</code>
            * [.create(faceListId, options)](#Client.face.faceList.create) ⇒ <code>Promise</code>
            * [.update(faceListId, options)](#Client.face.faceList.update) ⇒ <code>Promise</code>
            * [.delete(faceListId)](#Client.face.faceList.delete) ⇒ <code>Promise</code>
            * [.get(faceListId)](#Client.face.faceList.get) ⇒ <code>Promise</code>
            * [.addFace(faceListId, options)](#Client.face.faceList.addFace) ⇒ <code>Promise</code>
            * [.deleteFace(faceListId, persistedFaceId)](#Client.face.faceList.deleteFace) ⇒ <code>Promise</code>
        * [.personGroup](#Client.face.personGroup) : <code>object</code>
            * [.create(personGroupId, name, userData)](#Client.face.personGroup.create) ⇒ <code>Promise</code>
            * [.delete(personGroupId)](#Client.face.personGroup.delete) ⇒ <code>Promise</code>
            * [.get(personGroupId)](#Client.face.personGroup.get) ⇒ <code>Promise</code>
            * [.trainingStatus(personGroupId)](#Client.face.personGroup.trainingStatus) ⇒ <code>Promise</code>
            * [.trainingStart(personGroupId)](#Client.face.personGroup.trainingStart) ⇒ <code>Promise</code>
            * [.update(personGroupId, name, userData)](#Client.face.personGroup.update) ⇒ <code>Promise</code>
            * [.list()](#Client.face.personGroup.list) ⇒ <code>Promise</code>
        * [.person](#Client.face.person) : <code>object</code>
            * [.addFace(personGroupId, personId, options)](#Client.face.person.addFace) ⇒ <code>Promise</code>
            * [.deleteFace(personGroupId, personId, persistedFaceId)](#Client.face.person.deleteFace) ⇒ <code>Promise</code>
            * [.updateFace(personGroupId, personId, persistedFaceId, userData)](#Client.face.person.updateFace) ⇒ <code>Promise</code>
            * [.getFace(personGroupId, personId, persistedFaceId)](#Client.face.person.getFace) ⇒ <code>Promise</code>
            * [.create(personGroupId, name, userData)](#Client.face.person.create) ⇒ <code>Promise</code>
            * [.delete(personGroupId, personId)](#Client.face.person.delete) ⇒ <code>Promise</code>
            * [.get(personGroupId, personId)](#Client.face.person.get) ⇒ <code>Promise</code>
            * [.update(personGroupId, name, userData)](#Client.face.person.update) ⇒ <code>Promise</code>
            * [.list(personGroupId)](#Client.face.person.list) ⇒ <code>Promise</code>
    * _inner_
        * [~detect(options)](#Client.face..detect) ⇒ <code>Promise</code>
        * [~similar(sourceFace, options)](#Client.face..similar) ⇒ <code>Promise</code>
        * [~grouping(faces)](#Client.face..grouping) ⇒ <code>Promise</code>
        * [~identify(faces, personGroupId, maxNumOfCandidatesReturned)](#Client.face..identify) ⇒ <code>Promise</code>
        * [~verify(faces)](#Client.face..verify) ⇒ <code>Promise</code>

<a name="Client.face.faceList"></a>

#### face.faceList : <code>object</code>
**Kind**: static namespace of <code>[face](#Client.face)</code>  

* [.faceList](#Client.face.faceList) : <code>object</code>
    * [.list()](#Client.face.faceList.list) ⇒ <code>Promise</code>
    * [.create(faceListId, options)](#Client.face.faceList.create) ⇒ <code>Promise</code>
    * [.update(faceListId, options)](#Client.face.faceList.update) ⇒ <code>Promise</code>
    * [.delete(faceListId)](#Client.face.faceList.delete) ⇒ <code>Promise</code>
    * [.get(faceListId)](#Client.face.faceList.get) ⇒ <code>Promise</code>
    * [.addFace(faceListId, options)](#Client.face.faceList.addFace) ⇒ <code>Promise</code>
    * [.deleteFace(faceListId, persistedFaceId)](#Client.face.faceList.deleteFace) ⇒ <code>Promise</code>

<a name="Client.face.faceList.list"></a>

##### faceList.list() ⇒ <code>Promise</code>
Lists the faceListIds, and associated names and/or userData.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  
<a name="Client.face.faceList.create"></a>

##### faceList.create(faceListId, options) ⇒ <code>Promise</code>
Creates a new face list with a user-specified ID.
A face list is a list of faces associated to be associated with a given person.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | Numbers, en-us letters in lower case, '-', '_'. Max length: 64 |
| options | <code>object</code> | Optional parameters |
| options.name | <code>string</code> | Name of the face List |
| options.userData | <code>string</code> | User-provided data associated with the face list. |

<a name="Client.face.faceList.update"></a>

##### faceList.update(faceListId, options) ⇒ <code>Promise</code>
Creates a new person group with a user-specified ID.
A person group is one of the most important parameters for the Identification API.
The Identification searches person faces in a specified person group.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | Numbers, en-us letters in lower case, '-', '_'. Max length: 64 |
| options | <code>object</code> | Optional parameters |
| options.name | <code>string</code> | Name of the face List |
| options.userData | <code>string</code> | User-provided data associated with the face list. |

<a name="Client.face.faceList.delete"></a>

##### faceList.delete(faceListId) ⇒ <code>Promise</code>
Deletes an existing person group.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | ID of face list to delete |

<a name="Client.face.faceList.get"></a>

##### faceList.get(faceListId) ⇒ <code>Promise</code>
Gets an existing face list.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | ID of face list to retrieve |

<a name="Client.face.faceList.addFace"></a>

##### faceList.addFace(faceListId, options) ⇒ <code>Promise</code>
Gets an existing face list.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | ID of face list to retrieve |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to image to be used |
| options.path | <code>string</code> | Path to image to be used |
| options.data | <code>string</code> | Image as a binary buffer |
| options.name | <code>string</code> | Optional name for the face |
| options.userData | <code>string</code> | Optional user-data for the face |
| options.targetFace | <code>string</code> | Optional face rectangle to specify the target face to be added into the face list, in the format of "targetFace=left,top,width,height". |

<a name="Client.face.faceList.deleteFace"></a>

##### faceList.deleteFace(faceListId, persistedFaceId) ⇒ <code>Promise</code>
Delete a face from the face list.  The face ID will be an ID returned in the addFace method,
not from the detect method.

**Kind**: static method of <code>[faceList](#Client.face.faceList)</code>  
**Returns**: <code>Promise</code> - - Promise; successful response is empty  

| Param | Type | Description |
| --- | --- | --- |
| faceListId | <code>string</code> | ID of face list to retrieve |
| persistedFaceId | <code>string</code> | ID of face in the face list |

<a name="Client.face.personGroup"></a>

#### face.personGroup : <code>object</code>
**Kind**: static namespace of <code>[face](#Client.face)</code>  

* [.personGroup](#Client.face.personGroup) : <code>object</code>
    * [.create(personGroupId, name, userData)](#Client.face.personGroup.create) ⇒ <code>Promise</code>
    * [.delete(personGroupId)](#Client.face.personGroup.delete) ⇒ <code>Promise</code>
    * [.get(personGroupId)](#Client.face.personGroup.get) ⇒ <code>Promise</code>
    * [.trainingStatus(personGroupId)](#Client.face.personGroup.trainingStatus) ⇒ <code>Promise</code>
    * [.trainingStart(personGroupId)](#Client.face.personGroup.trainingStart) ⇒ <code>Promise</code>
    * [.update(personGroupId, name, userData)](#Client.face.personGroup.update) ⇒ <code>Promise</code>
    * [.list()](#Client.face.personGroup.list) ⇒ <code>Promise</code>

<a name="Client.face.personGroup.create"></a>

##### personGroup.create(personGroupId, name, userData) ⇒ <code>Promise</code>
Creates a new person group with a user-specified ID.
A person group is one of the most important parameters for the Identification API.
The Identification searches person faces in a specified person group.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Numbers, en-us letters in lower case, '-', '_'. Max length: 64 |
| name | <code>string</code> | Person group display name. The maximum length is 128. |
| userData | <code>string</code> | User-provided data attached to the group. The size limit is 16KB. |

<a name="Client.face.personGroup.delete"></a>

##### personGroup.delete(personGroupId) ⇒ <code>Promise</code>
Deletes an existing person group.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Name of person group to delete |

<a name="Client.face.personGroup.get"></a>

##### personGroup.get(personGroupId) ⇒ <code>Promise</code>
Gets an existing person group.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Name of person group to get |

<a name="Client.face.personGroup.trainingStatus"></a>

##### personGroup.trainingStatus(personGroupId) ⇒ <code>Promise</code>
Retrieves the training status of a person group. Training is triggered by the Train PersonGroup API.
The training will process for a while on the server side. This API can query whether the training
is completed or ongoing.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Name of person group to get |

<a name="Client.face.personGroup.trainingStart"></a>

##### personGroup.trainingStart(personGroupId) ⇒ <code>Promise</code>
Starts a person group training.
Training is a necessary preparation process of a person group before identification.
Each person group needs to be trained in order to call Identification. The training
will process for a while on the server side even after this API has responded.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Name of person group to get |

<a name="Client.face.personGroup.update"></a>

##### personGroup.update(personGroupId, name, userData) ⇒ <code>Promise</code>
Updates an existing person group's display name and userData.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | Numbers, en-us letters in lower case, '-', '_'. Max length: 64 |
| name | <code>string</code> | Person group display name. The maximum length is 128. |
| userData | <code>string</code> | User-provided data attached to the group. The size limit is 16KB. |

<a name="Client.face.personGroup.list"></a>

##### personGroup.list() ⇒ <code>Promise</code>
Lists all person groups in the current subscription.

**Kind**: static method of <code>[personGroup](#Client.face.personGroup)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  
<a name="Client.face.person"></a>

#### face.person : <code>object</code>
**Kind**: static namespace of <code>[face](#Client.face)</code>  

* [.person](#Client.face.person) : <code>object</code>
    * [.addFace(personGroupId, personId, options)](#Client.face.person.addFace) ⇒ <code>Promise</code>
    * [.deleteFace(personGroupId, personId, persistedFaceId)](#Client.face.person.deleteFace) ⇒ <code>Promise</code>
    * [.updateFace(personGroupId, personId, persistedFaceId, userData)](#Client.face.person.updateFace) ⇒ <code>Promise</code>
    * [.getFace(personGroupId, personId, persistedFaceId)](#Client.face.person.getFace) ⇒ <code>Promise</code>
    * [.create(personGroupId, name, userData)](#Client.face.person.create) ⇒ <code>Promise</code>
    * [.delete(personGroupId, personId)](#Client.face.person.delete) ⇒ <code>Promise</code>
    * [.get(personGroupId, personId)](#Client.face.person.get) ⇒ <code>Promise</code>
    * [.update(personGroupId, name, userData)](#Client.face.person.update) ⇒ <code>Promise</code>
    * [.list(personGroupId)](#Client.face.person.list) ⇒ <code>Promise</code>

<a name="Client.face.person.addFace"></a>

##### person.addFace(personGroupId, personId, options) ⇒ <code>Promise</code>
Adds a face to a person for identification. The maximum face count for each person is 248.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person that the face is added to. |
| options | <code>object</code> | The source specification. |
| options.url | <code>string</code> | URL to image to be used. |
| options.path | <code>string</code> | Path to image to be used. |
| options.data | <code>string</code> | Image as a binary buffer |
| options.userData | <code>string</code> | Optional. Attach user data to person's face. The maximum length is 1024. |
| options.targetFace | <code>object</code> | Optional. The rectangle of the face in the image. |

<a name="Client.face.person.deleteFace"></a>

##### person.deleteFace(personGroupId, personId, persistedFaceId) ⇒ <code>Promise</code>
Deletes a face from a person.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person that the face is removed from. |
| persistedFaceId | <code>string</code> | The ID of the face to be deleted. |

<a name="Client.face.person.updateFace"></a>

##### person.updateFace(personGroupId, personId, persistedFaceId, userData) ⇒ <code>Promise</code>
Updates a face for a person.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person that the face is updated on. |
| persistedFaceId | <code>string</code> | The ID of the face to be updated. |
| userData | <code>string</code> | Optional. Attach user data to person's face. The maximum length is 1024. |

<a name="Client.face.person.getFace"></a>

##### person.getFace(personGroupId, personId, persistedFaceId) ⇒ <code>Promise</code>
Get a face for a person.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person that the face is to get from. |
| persistedFaceId | <code>string</code> | The ID of the face to get. |

<a name="Client.face.person.create"></a>

##### person.create(personGroupId, name, userData) ⇒ <code>Promise</code>
Creates a new person in a specified person group for identification.
The number of persons has a subscription limit. Free subscription amount is 1000 persons.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| name | <code>string</code> | Target person's display name. The maximum length is 128. |
| userData | <code>string</code> | Optional fields for user-provided data attached to a person. Size limit is 16KB. |

<a name="Client.face.person.delete"></a>

##### person.delete(personGroupId, personId) ⇒ <code>Promise</code>
Deletes an existing person from a person group.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person to delete. |

<a name="Client.face.person.get"></a>

##### person.get(personGroupId, personId) ⇒ <code>Promise</code>
Gets an existing person from a person group.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| personId | <code>string</code> | The target person to get. |

<a name="Client.face.person.update"></a>

##### person.update(personGroupId, name, userData) ⇒ <code>Promise</code>
Updates a person's information.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |
| name | <code>string</code> | Target person's display name. The maximum length is 128. |
| userData | <code>string</code> | Optional fields for user-provided data attached to a person. Size limit is 16KB. |

<a name="Client.face.person.list"></a>

##### person.list(personGroupId) ⇒ <code>Promise</code>
Lists all persons in a person group, with the person information.

**Kind**: static method of <code>[person](#Client.face.person)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| personGroupId | <code>string</code> | The target person's person group. |

<a name="Client.face..detect"></a>

#### face~detect(options) ⇒ <code>Promise</code>
Call the Face Detected API
Detects human faces in an image and returns face locations, face landmarks, and
optional attributes including head-pose, gender, and age. Detection is an essential
API that provides faceId to other APIs like Identification, Verification,
and Find Similar.

**Kind**: inner method of <code>[face](#Client.face)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to image to be used |
| options.path | <code>string</code> | Path to image to be used |
| options.data | <code>string</code> | Image as a binary buffer |
| options.returnFaceId | <code>boolean</code> | Include face ID in response? |
| options.analyzesFaceLandmarks | <code>boolean</code> | Analyze face landmarks? |
| options.analyzesAge | <code>boolean</code> | Analyze age? |
| options.analyzesGender | <code>boolean</code> | Analyze gender? |
| options.analyzesHeadPose | <code>boolean</code> | Analyze headpose? |
| options.analyzesSmile | <code>boolean</code> | Analyze smile? |
| options.analyzesFacialHair | <code>boolean</code> | Analyze facial hair? |

<a name="Client.face..similar"></a>

#### face~similar(sourceFace, options) ⇒ <code>Promise</code>
Detect similar faces using faceIds (as returned from the detect API), or faceListId
(as returned from the facelist API).

**Kind**: inner method of <code>[face](#Client.face)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| sourceFace | <code>string</code> | String of faceId for the source face |
| options | <code>object</code> | Options object |
| options.candidateFaces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use as candidates |
| options.candidateFaceListId | <code>string</code> | Id of face list, created via FaceList.create |
| options.maxCandidates | <code>Number</code> | Optional max number for top candidates (default is 20, max is 20) |

<a name="Client.face..grouping"></a>

#### face~grouping(faces) ⇒ <code>Promise</code>
Divides candidate faces into groups based on face similarity using faceIds.
The output is one or more disjointed face groups and a MessyGroup.
A face group contains the faces that have similar looking, often of the same person.
There will be one or more face groups ranked by group size, i.e. number of face.
Faces belonging to the same person might be split into several groups in the result.
The MessyGroup is a special face group that each face is not similar to any other
faces in original candidate faces. The messyGroup will not appear in the result if
all faces found their similar counterparts. The candidate face list has a
limit of 100 faces.

**Kind**: inner method of <code>[face](#Client.face)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use |

<a name="Client.face..identify"></a>

#### face~identify(faces, personGroupId, maxNumOfCandidatesReturned) ⇒ <code>Promise</code>
Identifies persons from a person group by one or more input faces.
To recognize which person a face belongs to, Face Identification needs a person group
that contains number of persons. Each person contains one or more faces. After a person
group prepared, it should be trained to make it ready for identification. Then the
identification API compares the input face to those persons' faces in person group and
returns the best-matched candidate persons, ranked by confidence.

**Kind**: inner method of <code>[face](#Client.face)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array of faceIds to use |
| personGroupId | <code>string</code> | Id of person group from which faces will be identified |
| maxNumOfCandidatesReturned | <code>Number</code> | Optional max number of candidates per face (default=1, max=5) |

<a name="Client.face..verify"></a>

#### face~verify(faces) ⇒ <code>Promise</code>
Analyzes two faces and determine whether they are from the same person.
Verification works well for frontal and near-frontal faces.
For the scenarios that are sensitive to accuracy please use with own judgment.

**Kind**: inner method of <code>[face](#Client.face)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| faces | <code>Array.&lt;string&gt;</code> | Array containing two faceIds to use |

<a name="Client.text"></a>

### Client.text : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.text](#Client.text) : <code>object</code>
    * [~proof(text, preContextText, postContextText)](#Client.text..proof) ⇒ <code>Promise</code>
    * [~spellCheck(text, preContextText, postContextText)](#Client.text..spellCheck) ⇒ <code>Promise</code>

<a name="Client.text..proof"></a>

#### text~proof(text, preContextText, postContextText) ⇒ <code>Promise</code>
Proofs a word or phrase.  Offers Microsoft Office Word-like spelling corrections. Longer phrases can
be checked, and the result will include casing corrections while avoiding aggressive corrections.

**Kind**: inner method of <code>[text](#Client.text)</code>  
**Returns**: <code>Promise</code> - - A promise in which the resulting JSON is returned.  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Word or phrase to spell check. |
| preContextText | <code>string</code> | Optional context of one or more words preceding the target word/phrase. |
| postContextText | <code>string</code> | Optional context of one or more words following the target word/phrase. |

<a name="Client.text..spellCheck"></a>

#### text~spellCheck(text, preContextText, postContextText) ⇒ <code>Promise</code>
Spell checks a word or phrase.  Spell checks offers search-engine-like corrections.  Short phrases
(up to 9 tokens) will be checked, and the result will be optimized for search queries, both in terms
of performance and relevance.

**Kind**: inner method of <code>[text](#Client.text)</code>  
**Returns**: <code>Promise</code> - - A promise in which the resulting JSON is returned.  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | Word or phrase to spell check. |
| preContextText | <code>string</code> | Optional context of one or more words preceding the target word/phrase. |
| postContextText | <code>string</code> | Optional context of one or more words following the target word/phrase. |

<a name="Client.video"></a>

### Client.video : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.video](#Client.video) : <code>object</code>
    * _static_
        * [.result](#Client.video.result)
            * [.get(operation)](#Client.video.result.get) ⇒ <code>Promise</code>
            * [.getVideo(url, pipe)](#Client.video.result.getVideo) ⇒ <code>Promise</code>
    * _inner_
        * [~trackFace(options)](#Client.video..trackFace) ⇒ <code>Promise</code>
        * [~detectMotion(options)](#Client.video..detectMotion) ⇒ <code>Promise</code>
        * [~stabilize(options)](#Client.video..stabilize) ⇒ <code>Promise</code>

<a name="Client.video.result"></a>

#### video.result
**Kind**: static property of <code>[video](#Client.video)</code>  

* [.result](#Client.video.result)
    * [.get(operation)](#Client.video.result.get) ⇒ <code>Promise</code>
    * [.getVideo(url, pipe)](#Client.video.result.getVideo) ⇒ <code>Promise</code>

<a name="Client.video.result.get"></a>

##### result.get(operation) ⇒ <code>Promise</code>
Checks the result of a given operation.  When an operation is deemed completed, the
status of the returned object should be 'Succeeded' (or, possibly, 'Failed'.) For
operations which return a JSON payload, the stringified-JSON is returned in the
processingResult field.  For operations which return a video, the location of the
video is provided in the resourceLocation field.  You can use the [getVideo](Client.video.result#getVideo) method
to help you retrieve that, as this would automatically attach the API key to request.

**Kind**: static method of <code>[result](#Client.video.result)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| operation | <code>Object</code> | Object holding the result URL |

<a name="Client.video.result.getVideo"></a>

##### result.getVideo(url, pipe) ⇒ <code>Promise</code>
Downloads the resulting video, for processors that returning videos instead of metadata.
Currently this applies to the [stabilize](Client.video#stabilize) operation.

**Kind**: static method of <code>[result](#Client.video.result)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting video  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | URL of the resource |
| pipe | <code>Object</code> | Destination for video, typically a fs object |

<a name="Client.video..trackFace"></a>

#### video~trackFace(options) ⇒ <code>Promise</code>
Start a face-tracking processor
Faces in a video will be tracked.

**Kind**: inner method of <code>[video](#Client.video)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to video to be processed |
| options.path | <code>string</code> | Path to video to be processed |
| options.stream | <code>stream</code> | Stream for video to be processed |

<a name="Client.video..detectMotion"></a>

#### video~detectMotion(options) ⇒ <code>Promise</code>
Start a motion-tracking processor
Motion in a video will be tracked.

**Kind**: inner method of <code>[video](#Client.video)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to video to be processed |
| options.path | <code>string</code> | Path to video to be processed |
| options.stream | <code>stream</code> | Stream for video to be processed |

<a name="Client.video..stabilize"></a>

#### video~stabilize(options) ⇒ <code>Promise</code>
Start a stablization processor
A stabilized version of you video will be generated.

**Kind**: inner method of <code>[video](#Client.video)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Options object |
| options.url | <code>string</code> | URL to video to be processed |
| options.path | <code>string</code> | Path to video to be processed |
| options.stream | <code>stream</code> | Stream for video to be processed |

<a name="Client.vision"></a>

### Client.vision : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.vision](#Client.vision) : <code>object</code>
    * _static_
        * [.models](#Client.vision.models) : <code>object</code>
            * [.list()](#Client.vision.models.list) ⇒ <code>Promise</code>
            * [.analyzeImage(model, options)](#Client.vision.models.analyzeImage) ⇒ <code>Promise</code>
    * _inner_
        * [~analyzeImage(options)](#Client.vision..analyzeImage) ⇒ <code>Promise</code>
        * [~thumbnail(options)](#Client.vision..thumbnail) ⇒ <code>Promise</code>
        * [~ocr(options)](#Client.vision..ocr) ⇒ <code>Promise</code>

<a name="Client.vision.models"></a>

#### vision.models : <code>object</code>
**Kind**: static namespace of <code>[vision](#Client.vision)</code>  

* [.models](#Client.vision.models) : <code>object</code>
    * [.list()](#Client.vision.models.list) ⇒ <code>Promise</code>
    * [.analyzeImage(model, options)](#Client.vision.models.analyzeImage) ⇒ <code>Promise</code>

<a name="Client.vision.models.list"></a>

##### models.list() ⇒ <code>Promise</code>
Lists the domain-specific image analysis models.

**Kind**: static method of <code>[models](#Client.vision.models)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  
<a name="Client.vision.models.analyzeImage"></a>

##### models.analyzeImage(model, options) ⇒ <code>Promise</code>
Analyze an image using a domain-specific image classifier.

**Kind**: static method of <code>[models](#Client.vision.models)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | Name of the model |
| options | <code>Object</code> | Options object location of the source image |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |

<a name="Client.vision..analyzeImage"></a>

#### vision~analyzeImage(options) ⇒ <code>Promise</code>
This operation does a deep analysis on the given image and then extracts a
set of rich visual features based on the image content.

**Kind**: inner method of <code>[vision](#Client.vision)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |
| options.data | <code>string</code> | Buffer of image to be analyzed |
| options.ImageType | <code>boolean</code> | Detects if image is clipart or a line drawing. |
| options.Color | <code>boolean</code> | Determines the accent color, dominant color, if image is black&white. |
| options.Faces | <code>boolean</code> | Detects if faces are present. If present, generate coordinates, gender and age. |
| options.Adult | <code>boolean</code> | Detects if image is pornographic in nature (nudity or sex act). Sexually suggestive content is also detected. |
| options.Categories | <code>boolean</code> | Image categorization; taxonomy defined in documentation. |
| options.Tags | <code>boolean</code> | Tags the image with a detailed list of words related to the image content. |
| options.Description | <code>boolean</code> | Describes the image content with a complete English sentence. |

<a name="Client.vision..thumbnail"></a>

#### vision~thumbnail(options) ⇒ <code>Promise</code>
Generate a thumbnail image to the user-specified width and height. By default, the
service analyzes the image, identifies the region of interest (ROI), and generates
smart crop coordinates based on the ROI. Smart cropping is designed to help when you
specify an aspect ratio that differs from the input image.

**Kind**: inner method of <code>[vision](#Client.vision)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be thumbnailed |
| options.path | <code>string</code> | Path to image to be thumbnailed |
| options.data | <code>string</code> | Buffer of image to be analyzed |
| options.width | <code>number</code> | Width of the thumb in pixels |
| options.height | <code>number</code> | Height of the thumb in pixels |
| options.smartCropping | <code>boolean</code> | Should SmartCropping be enabled? |
| options.pipe | <code>Object</code> | We'll pipe the returned image to this object |

<a name="Client.vision..ocr"></a>

#### vision~ocr(options) ⇒ <code>Promise</code>
Optical Character Recognition (OCR) detects text in an image and extracts the recognized
characters into a machine-usable character stream.

**Kind**: inner method of <code>[vision](#Client.vision)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | Options object describing features to extract |
| options.url | <code>string</code> | Url to image to be analyzed |
| options.path | <code>string</code> | Path to image to be analyzed |
| options.data | <code>string</code> | Buffer of image to be analyzed |
| options.language | <code>string</code> | BCP-47 language code of the text to be detected in the image. Default value is "unk", then the service will auto detect the language of the text in the image. |
| options.detectOrientation | <code>string</code> | Detect orientation of text in the image |

<a name="Client.weblm"></a>

### Client.weblm : <code>object</code>
**Kind**: static namespace of <code>[Client](#Client)</code>  

* [.weblm](#Client.weblm) : <code>object</code>
    * [~listModels()](#Client.weblm..listModels) ⇒ <code>Promise</code>
    * [~breakIntoWords(model, text, options)](#Client.weblm..breakIntoWords) ⇒ <code>Promise</code>
    * [~generateWords(model, words, options)](#Client.weblm..generateWords) ⇒ <code>Promise</code>
    * [~getJointProbabilities(model, phrases, order)](#Client.weblm..getJointProbabilities) ⇒ <code>Promise</code>
    * [~getConditionalProbabilities(model, queries, order)](#Client.weblm..getConditionalProbabilities) ⇒ <code>Promise</code>

<a name="Client.weblm..listModels"></a>

#### weblm~listModels() ⇒ <code>Promise</code>
List available language models for the service currently.

**Kind**: inner method of <code>[weblm](#Client.weblm)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  
<a name="Client.weblm..breakIntoWords"></a>

#### weblm~breakIntoWords(model, text, options) ⇒ <code>Promise</code>
Breaks text in to consituent words

**Kind**: inner method of <code>[weblm](#Client.weblm)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | Name of model. Currently one of title/anchor/query/body |
| text | <code>string</code> | Text to break.  E.g. onetwothree |
| options | <code>Object</code> | Options object |
| options.order | <code>Number</code> | Optional N-gram order. Default is 5 |
| options.maxCandidates | <code>Number</code> | Optional maximum candidate count. Default is 5 |

<a name="Client.weblm..generateWords"></a>

#### weblm~generateWords(model, words, options) ⇒ <code>Promise</code>
Generates a list of candidate of words that would follow the a given sequence of one or more words

**Kind**: inner method of <code>[weblm](#Client.weblm)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | Name of model. Currently one of title/anchor/query/body |
| words | <code>string</code> | Text to break.  E.g. 'hello world wide' |
| options | <code>Object</code> | Options object |
| options.order | <code>Number</code> | Optional N-gram order. Default is 5 |
| options.maxCandidates | <code>Number</code> | Optional maximum candidate count. Default is 5 |

<a name="Client.weblm..getJointProbabilities"></a>

#### weblm~getJointProbabilities(model, phrases, order) ⇒ <code>Promise</code>
Generates a list of candidate of words that would follow the a given sequence of one or more words

**Kind**: inner method of <code>[weblm](#Client.weblm)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | Name of model. Currently one of title/anchor/query/body |
| phrases | <code>Array.&lt;string&gt;</code> | One or more phrases for which to look up the probalities of the word sequences |
| order | <code>Number</code> | Optional N-gram order. Default is 5 |

<a name="Client.weblm..getConditionalProbabilities"></a>

#### weblm~getConditionalProbabilities(model, queries, order) ⇒ <code>Promise</code>
Generates a list of candidate of words that would follow the a given sequence of one or more words

**Kind**: inner method of <code>[weblm](#Client.weblm)</code>  
**Returns**: <code>Promise</code> - - Promise resolving with the resulting JSON  

| Param | Type | Description |
| --- | --- | --- |
| model | <code>string</code> | Name of model. Currently one of title/anchor/query/body |
| queries | <code>Array</code> | One of more objects consisting of 'words'/'word' pairs,      where the conditional probability of 'word' in the context of 'words' is computed. |
| order | <code>Number</code> | Optional N-gram order. Default is 5 |

## License
Licensed as MIT - please see LICENSE for details.
