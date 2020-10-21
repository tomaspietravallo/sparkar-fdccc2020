# Manipulating Multiple Scene Objects with Scripts in Spark AR

> This tutorial is part of the 2020 Facebook Developer Circles Community Challenge, if you wish to read the entry you can do so [here](), feel free to leave feedback or like the entry. 

## Overview
In this tutorial, we will be creating an AR effect that manipulates multiple objects by taking advantage of the power of scripts in Spark AR Studio. The filter will produce a slinky-eye trail that is always catching up to the user's face. The key things we will explore are:
- Using patterns to access multiple objects from our project
- Using arrays and iterators to manipulate several objects
- The advantage of using scripts in certain situations

## Prerequisites
- [Spark AR Studio version 82 or higher](https://sparkar.facebook.com/ar-studio/download/)
- A good understanding of [3D Objects in Spark AR Studio](https://sparkar.facebook.com/ar-studio/learn/articles/3D/3D-objects#adding-3d-objects-to-your-project)
- A basic understanding of the following concepts:
  - [Variables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Variables) \- [let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) and [const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)
  - [Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
  - [Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions)
  - [Comments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Comments)

- An editor like [VS Code](https://code.visualstudio.com/), [Atom](https://atom.io/), or [Sublime Text](https://www.sublimetext.com/). VS Code is preferred, see why [here](https://sparkar.facebook.com/ar-studio/learn/scripting/scripting-basics/#code-autocomplete), but it isn't the only option

> If you don't have an understanding of some concepts mentioned above, you can do a light reading of the respective links.

# Getting started
The first part of any project is coming up with an idea and visualizing it, which will help us understand how to approach the problem. We said we would be creating a trailing effect around the eye area; to help you visualize this, you can find how the result will look below.

![Preview the result](https://github.com/tomaspietravallo/sparkar-fdccc2020/blob/gh-pages/tutorial-images/preview-result.gif)

> You can also try out the final filter [here](https://www.instagram.com/ar/825126108015002/)

You may have been able to tell that a suitable approach to get this look - and the one we will show in this tutorial - is to have multiple face meshes that are all catching up to the face at different speeds, and you would be correct.

To achieve the slow/catching up look, we will use both Exponential Smoothing and Delay.

The project shown above uses 36 meshes; as you can imagine, connecting and tweaking the parameters for 36 meshes in the Patch Editor would be a slow and tedious process, as neither 'Dampening' (exponential smoothing patch) nor 'Duration' (delay patch) can take in a value in the Patch Editor. Moreover, we need to smooth each component of a vector (x,y,z) individually, bringing the total up to 144 values to tweak (*36\*3 + 36*); that's were the scripts come in.

# Preparing our scene

## Scene hierarchy
![Scene hierarchys screenshot](https://github.com/tomaspietravallo/sparkar-fdccc2020/blob/gh-pages/tutorial-images/scene-hierarchy-screenshot.jpg)

As you can see, the scene is pretty simple; it contains a faceTracker and 36 meshes - meshes 03 to 35 omitted in the screenshot. 

We are going to position the meshes in world coordinates, so they are placed outside the Focal Distance. For convenience, they are all set as children of a nullObject ("meshes0").

We are going to configure the materials used for the meshes as [Flat](https://sparkar.facebook.com/ar-studio/learn/articles/textures-and-materials/flat-material/#creating-a-flat-material) meaning we can remove the lights (ambientLight0 and directionalLight0), but if we add any other material type we will have to add them back, otherwise they won't be illuminated.

## Materials
We want our meshes to show just the eyes; we can achieve this by combining the faceTexture with an alpha mask.

We can get the face texture by going to the faceTracker and adding Texture extraction, and we can mask the eyes by using a simple eye-shaped image on the alpha slot of the materials.

We are going to use multiple masks with multiple materials to make the trail get thinner towards the end.

There will be nine materials, named faceMeshMat\[00-08\], so that every four meshes in the trail, there will be a change in the material used by the mesh. Each material will have the 'faceTracker Texture' assigned to its [Diffuse](https://sparkar.facebook.com/ar-studio/learn/articles/textures-and-materials/flat-material#adding-colors-and-textures) and one of the mask textures assigned to its [Alpha](https://sparkar.facebook.com/ar-studio/learn/articles/textures-and-materials/flat-material#properties), making the trail get a little bit smaller with every material change.

## Textures
In the textures, we will only have the faceTracker Texture extraction, which by default is called "faceTracker0 Texture0". The eight textures used for the masks which are named \[00-08\]

![A collage of nine pictures showing the different masks](https://github.com/tomaspietravallo/sparkar-fdccc2020/blob/gh-pages/tutorial-images/alpha-masks.jpg)
![An overlay showing "mask 1" and the Spark AR reference image](https://github.com/tomaspietravallo/sparkar-fdccc2020/blob/gh-pages/tutorial-images/alpha-mask-1.jpg)

In the images above, you can see how the masks get progressively smaller, as well as an overlay of the reference that Spark AR provides used to create the textures.

We can easily make the mask by just using the [Face Assets Spark AR provides](https://sparkar.facebook.com/ar-studio/learn/articles/people-tracking/face-reference-assets/) and painting white the area around the eyes, as you can see in the second picture.

# Scripting
Now that the scene is done we can start to make our script. The goal is to getting all the masks, which up to this moment have been static, to move in the fashion described [above](#getting-started).

To add a script, go to "Create Asset", select Script, and then open it in your editor of choice.

You are likely to see some default template with helpful links and instructions that Spark AR Studio provides every time you create a new script; we won't use any of the default code so you can delete it, but feel free to check out some of the links after this tutorial.

## Async/await
> If you already know what Javascript async/await is, you can skip this part and continue to the [next section](#loading-in-the-modules).

Asynchronous programming is the counterpart to the more well-known synchronous programming.

In asynchronous programming, the concept of Promises is introduced. A Promise is a proxy for a value not necessarily known when the promise is created; a Promise can be in one of three states:
1. Pending: It has neither been fulfilled nor rejected.
2. Fulfilled: The operation/s were completed successfully.
3. Rejected: The operation failed.

With `await` (inside an `async` function), you can define in which operations the execution should pause and wait for until the Promise is resolved.

Many functions in Spark AR Studio return a Promise, like `Scene.root.findFirst()` - used to access objects from our scene. For these cases, async/await provides an easy way of working with Promises.

Practical example:
```javascript
const Scene = require('Scene');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');

async function getCameraTextureMultiplyAndSet(){
    // Wait for findFirst to fetch the camera texture 👇
    const ct = await Textures.findFirst('cameraTexture0');
    // Wait for findFirst to fetch the material 👇
    const myMaterial = await Materials.findFirst('material0');
    let brighter = Reactive.mul(ct, 1.2); // Multiply the RGBA signal by 1.2
    myMaterial.setTextureSlot('DIFFUSE', brighter); // Set the Diffuse slot to our texture
};
getCameraTextureMultiplyAndSet(); // Execute the function

/* With closure (more advanced):
(async function(){
    const ct = await Textures.findFirst('cameraTexture0');
    const myMaterial = await Materials.findFirst('material0');
    let brighter = Reactive.mul(ct, 1.2);
    myMaterial.setTextureSlot('DIFFUSE', brighter);
})();
*/
```

## Loading in the modules
We'll start by loading the different modules we will need for this project; these are going to be our building blocks. You can check a full list of the modules available in Spark AR Studio [here](https://sparkar.facebook.com/ar-studio/learn/reference/scripting/summary#before-you-start).

```javascript
const Scene = require('Scene'); // This module is used to access and manipulate the scene
const FaceTracking = require('FaceTracking'); // We'll use this module to get the face position data
const Reactive = require('Reactive'); // You can think of Reactive as Spark's special math module
```

We assign each module to a [constant](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const) so that we can use it later.

## Accessing multiple Scene Objects
Now we want to get all of our face meshes so that we can manipulate them. You could try to do something like this:
```javascript
Scene.root.findFirst('00');
Scene.root.findFirst('01');
Scene.root.findFirst('02');
Scene.root.findFirst('03');
// ...
Scene.root.findFirst('35');
```
But as you may be able to tell, this isn't flexible, and it's very cumbersome. Instead of using `findFirst`, we are going to use [`findByPath`](https://sparkar.facebook.com/ar-studio/learn/reference/classes/scenemodule.sceneobjectbase), which allows us to access multiple objects at once.

To do this, we specify a pattern for `findByPath` to match. This pattern can use the following control characters:

| Character | Meaning | Example |
| :-------: | :------ | :------ |
| * (asterisk) | It matches any characters sequence (including digits) | `'Device/Camera/Focal Distance/mesh*'` will match any object named mesh followed by some character(s) found inside the Focal Distance |
| * (asterisk) |  As standalone component it matches one level of the scene tree (Any child object) | `'Device/Camera/Focal Distance/mesh/*'`  will match any object (no matter the name) which is child of some object called "mesh"
| ** (double asterisk) | As standalone component matches **any** level of scene tree | `'**'` will match **any** object (anywhere on the scene)
| / (forward slash) |  Is a path component separator, separating different levels of the tree | `'**/mesh'` will match the child of any object on the scene which is called "mesh"
| \ (backslash) | It can be used to escape any of the control characters (including \'\\\' itself) | `'**/\*'` will match any object on the scene which is named \*, here the '\*' has to be escaped, otherwise it would be interpreted as a control character |


Knowing the previous, we can see that there are many ways to access our face meshes. An appropriate method for our case would be:

```javascript
// This method will return us any object which is a child of any object called "meshes0"
Scene.root.findByPath('**/meshes0/*');
```

Using patterns will allow us to easily add or remove meshes as we deem necessary, without having to modify the code like we would have to with  `findFirst`.

`findByPath` and `findFirst` both return a promise, so we have to use `await` and wait for the Promise to be resolved:

```javascript
// ... Modules truncated
async function animateMeshes(){
  let meshes = await Scene.root.findByPath('**/meshes0/*'); // an array of objects
};
animateMeshes();
```

## Getting the face coordinates
We can use the [FaceTracking module](https://sparkar.facebook.com/ar-studio/learn/reference/classes/facetrackingmodule/) to get the position of the face in our script; this will allow us to do some math operations with the value and later use the result to animate the face meshes.

We are going to use the [`face` method](https://sparkar.facebook.com/ar-studio/learn/reference/classes/facetrackingmodule.face) to get the values for the first face - which in the faceTracker "Tracked Face" dropdown is called "Face 1"; and then read the `cameraTransform` property to get the position of the face.

Computers (and Javascript) [count from 0](https://www.howtogeek.com/149225/why-do-computers-count-from-zero/), so the 0th face is the first one

```javascript
// Store the reference to the face position data in a variable so we can use it later
let transform = FaceTracking.face(0).cameraTransform;
```

## Animating multiple objects
We already saw how to access multiple objects and get an array of objects from our scene. Now that we have an array, we can iterate over it with our code, eliminating the need to repeat ourselves 36 times.

We can use the [length property](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length) of the array together with a [for loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for) to iterate over the array. The loop will execute the instructions inside the curly braces as long as the index is less than length - when it reaches the end of the array.

> Because indices start from zero, an array's length is always greater than the highest index.

A side effect of the combination of `findByPath` and `for` loops using the length property (instead of a typed in number) is that we can add or remove meshes without having to modify the code, giving us a lot of flexibility!

```javascript
// ... Modules truncated
async function animateMeshes(){
  let meshes = await Scene.root.findByPath('**/meshes0/*'); // an array of objects

  let transform = FaceTracking.face(0).cameraTransform;

  let maxSmooth = 350;
  let maxDelay = 0.5;

  for (let index = 0; index < meshes.length; index++) {
      // ...
  }
};
animateMeshes();
```

By using a `for` loop, we get an `index` which we can use to create different smoothing and delay values for the objects.

```javascript
/*
By dividing the max values we want by 'meshes.length' we get the "step" between objects
We can then multiply that value by our index to get which values corresponds to the specific index (mesh)

We use 'index + 1' because the first mesh (multiplying by 0), would be placed on the exact face position, and the effect wouldn't be noticeable
*/

let smoothBy = (maxSmooth / meshes.length) * index + 1;
let delayBy = (maxDelay / meshes.length) * index + 1;
```

Combining the loop with the code to make specific settings for each iteration, we get the following:

```javascript
// ... Modules truncated
async function animateMeshes(){
  let meshes = await Scene.root.findByPath('**/meshes0/*'); // an array of objects

  let transform = FaceTracking.face(0).cameraTransform;

  let maxSmooth = 350;
  let maxDelay = 0.5;

  for (let index = 0; index < meshes.length; index++) {
      let mesh = meshes[index];

      let smoothBy = (maxSmooth / meshes.length) * index + 1;
      let delayBy = (maxDelay / meshes.length) * index + 1;

      // Calculate the delayed and smoothed x,y,z values
      let xValue = Reactive.expSmooth( transform.x.delayBy({ milliseconds: delayBy }), smoothBy);
      let yValue = Reactive.expSmooth( transform.y.delayBy({ milliseconds: delayBy }), smoothBy);
      let zValue = Reactive.expSmooth( transform.z.delayBy({ milliseconds: delayBy * 10 }), smoothBy);
      /*
      I prefer having the Z movement delayed a bit more; it looks funnier when you move away from or close to the camera.
      Making this tiny adjustment would have meant modifying another 36 Patches if done in the Patch Editor
      */
  }
};
animateMeshes();
```

As you can see, changing the values for either smoothing or delay is remarkably easy, and if you prefer to have some axis affected in a more or less pronounced way relative to other axes, you can easily change it.

Now that we have a Scene Object and the smoothing and delay values, now we just have to use them!

To do this, we write the xValue, yValue and, zValue to the objects' [transform](https://sparkar.facebook.com/ar-studio/learn/reference/classes/scenemodule.sceneobjectbase).

```javascript
mesh.transform.x = xValue;
mesh.transform.y = yValue;
mesh.transform.z = zValue;

/*
You can apply the delaying/smoothing to the rotation if you want to,
but you it still looks good if you don't
*/
mesh.transform.rotationX = transform.rotationX;
mesh.transform.rotationY = transform.rotationY;
mesh.transform.rotationZ = transform.rotationZ;
```

## The result
Here is the code as found in [the project](#project). Take some time to read it and see if you can understand it; if you don't, you can use this map to find the different sections you may want to revise:

- [Getting started](#getting-started)
- [Preparing our scene](#preparing-our-scene)
    - [Scene hierarchy](#scene-hierarchy)
    - [Materials](#materials)
    - [Textures](#textures)
- [Scripts](#scripting)
     - [Async/await](#asyncawait) \- \[1\]
     - [Loading in the modules](#loading-in-the-modules) \- \[2\]
     - [Accessing multiple Scene Objects](#accessing-multiple-scene-objects) \- \[3\]
     - [Getting the face coordinates](#getting-the-face-coordinates) \- \[4\]
     - [Animating multiple objects](#animating-multiple-objects) \- \[5\]


```javascript
// [2]
const Scene = require('Scene');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');

// [1]
async function animateMeshes(){
  // [1] [3]
  let meshes = await Scene.root.findByPath('**/meshes0/*');

  // [4]
  let transform = FaceTracking.face(0).cameraTransform;

  let maxSmooth = 350;
  let maxDelay = 0.5;

  // [5]
  for (let index = 0; index < meshes.length; index++) {
      let mesh = meshes[index];

      let smoothBy = (maxSmooth / meshes.length) * index + 1;
      let delayBy = (maxDelay / meshes.length) * index + 1;

      let xValue = Reactive.expSmooth( transform.x.delayBy({ milliseconds: delayBy }), smoothBy);
      let yValue = Reactive.expSmooth( transform.y.delayBy({ milliseconds: delayBy }), smoothBy);
      let zValue = Reactive.expSmooth( transform.z.delayBy({ milliseconds: delayBy * 10 }), smoothBy);

      mesh.transform.x = xValue;
      mesh.transform.y = yValue;
      mesh.transform.z = zValue;

      mesh.transform.rotationX = transform.rotationX;
      mesh.transform.rotationY = transform.rotationY;
      mesh.transform.rotationZ = transform.rotationZ;
  }
};

animateMeshes();
```

# Next steps
You saw how scripts can easily control multiple objects at once, and this makes the amount of parameters to tweak decrease dramatically, allowing you to explore more options and be more creative. I encourage you to come up with a project where things behave in a systematic manner, and then use what you learned here to make it.

> Tip: The [Materials](https://sparkar.facebook.com/ar-studio/learn/reference/classes/materialsmodule) and [Textures](https://sparkar.facebook.com/ar-studio/learn/reference/classes/texturesmodule) modules also contain `findByPath` methods, possibilities are endless

Don't ever hesitate to look at the [Spark AR Scripting Object Reference](https://sparkar.facebook.com/ar-studio/learn/reference/scripting/summary), as it contains descriptions and examples for all the modules available and their methods.

This project is Open Source, and so can be yours! You can publish your projects for free on GitHub and help the Spark AR Community grow; make sure to include a [contributing.md](v) so people know how to contribute and a [code of conduct](https://github.com/tomaspietravallo/sparkar-fdccc2020/blob/gh-pages/code-of-conduct.md); this project has both, if you choose to contribute, please make sure to read them before contributing. If you want to know more about contributing to open source projects, check this free course: \"[How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)\"

# Related content
- [Spark AR Scripting Object Reference](https://sparkar.facebook.com/ar-studio/learn/reference/scripting/summary)
- [Reactive Programming \(in Spark AR Studio\)](https://sparkar.facebook.com/ar-studio/learn/scripting/reactive-programming#watching-signals)
- [Spark AR Community Facebook Group](https://www.facebook.com/groups/SparkARcommunity)
- The Spark AR Community [awesome-spark-ar](https://github.com/Spark-AR-Community/awesome-spark-ars) list - [Script section](https://github.com/Spark-AR-Community/awesome-spark-ar#scripts)
- [SparkAR-Snippets](https://github.com/Spark-AR-Community/SparkAR-Snippets), a colection of code snippets from the Spark AR community
