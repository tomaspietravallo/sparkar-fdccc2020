const Scene = require('Scene');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');

async function animateMeshes(){
  let meshes = await Scene.root.findByPath('**/meshes0/*');

  let transform = FaceTracking.face(0).cameraTransform;

  let maxSmooth = 350;
  let maxDelay = 0.5;

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