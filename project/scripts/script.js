const Scene = require('Scene');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');
const Materials = require('Materials');

async function createAndAnimateMeshes() {
  // Settings you can modfify (download the project play around! 🙌✨)
  let amountOfMeshes = 36;
  let maxSmooth = 350;
  let maxDelay = 0.5;
  // ----------------

  let meshesParent = await Scene.root.findFirst('meshesNullObj');

  let materials = await Materials.findUsingPattern('mask-material*');

  materials.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

  let transform = FaceTracking.face(0).cameraTransform;

  for (let index = 0; index < amountOfMeshes; index++) {
    let newMesh = await Scene.create('FaceMesh', {
      name: 'mesh' + index,
    });

    await meshesParent.addChild(newMesh);

    let materialIndex = Math.round(
      (index / amountOfMeshes) * (materials.length - 1)
    );

    newMesh.material = materials[materialIndex];

    let smoothBy = (maxSmooth / amountOfMeshes) * (index + 1);
    let delayBy = (maxDelay / amountOfMeshes) * (index + 1);

    let xValue = Reactive.expSmooth(
      transform.x.delayBy({ milliseconds: delayBy }),
      smoothBy
    );
    let yValue = Reactive.expSmooth(
      transform.y.delayBy({ milliseconds: delayBy }),
      smoothBy
    );
    let zValue = Reactive.expSmooth(
      transform.z.delayBy({ milliseconds: delayBy * 10 }),
      smoothBy
    );

    newMesh.transform.x = xValue;
    newMesh.transform.y = yValue;
    newMesh.transform.z = zValue;

    newMesh.transform.rotationX = transform.rotationX;
    newMesh.transform.rotationY = transform.rotationY;
    newMesh.transform.rotationZ = transform.rotationZ;
  }
}

createAndAnimateMeshes();
