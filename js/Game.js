document.addEventListener("DOMContentLoaded", () => {
  new Game('renderCanvas')
}, false)

Game = function (canvasId) {
  // private
  let _this = this
  let canvas = document.getElementById(canvasId)
  let engine = new BABYLON.Engine(canvas, true)
  this.engine = engine

  this._rockets = []
  this._explosionRadius = []

  // public
  _this.actualTime = Date.now()
  this.allSpawnPoints = [
    new BABYLON.Vector3(-20, 5, 0),
    new BABYLON.Vector3(0, 5, 0),
    new BABYLON.Vector3(20, 5, 0),
    new BABYLON.Vector3(-40, 5, 0)
  ]
  this.scene = this._initScene(engine)

  // init de la camera et du décor
  let _player = new Player(_this)
  let _arena = new Arena(_this)
  this._PlayerData = _player;

  // Core
  engine.runRenderLoop(() => {
    // Récuperer le ratio par les fps
    _this.fps = Math.round(1000/engine.getDeltaTime())

    // Checker le mouvement du joueur en lui envoyant le ratio de déplacement
    _player._checkMove((_this.fps)/60)

    _this.renderRockets();
    _this.renderExplosionRadius();

    _this.scene.render()

    // Si launchBullets est a true, on tire
    if(_player.camera.weapons.launchBullets === true){
      _player.camera.weapons.launchFire()
    }
  })

  // Adjusting
  window.addEventListener("resize", () => {
    if (engine) {
      engine.resize()
    }
  }, false)
}

Game.prototype = {
  _initScene: function (engine) {
    let scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color3(0, 0, 0)
    // Definit le sens de la chute (gravite de la terre 9.81)
    scene.gravity = new BABYLON.Vector3(0,-9.81,0)
    scene.collisionsEnabled = true
    return scene
  },
  renderRockets: function () {
    for (let i = 0; i < this._rockets.length; i++) {
      let rayRocket = new BABYLON.Ray(this._rockets[i].position, this._rockets[i].direction)

      // On regarde quel est le premier objet qu'on touche
      let meshFound = this._rockets[i].getScene().pickWithRay(rayRocket)

      // Si la distance au premier objet touché est inférieure à 10, on détruit la roquette
      if (!meshFound || meshFound.distance < 10) {
        // On vérifie qu'on a bien touché quelque chose
        if (meshFound.pickedMesh && !meshFound.pickedMesh.isMain) {
          // On crée une sphere qui représentera la zone d'impact
          let explosionRadius = BABYLON.Mesh.CreateSphere("sphere", 5.0, 20, this.scene)
          explosionRadius.computeWorldMatrix(true)
          if (this._PlayerData.isAlive && this._PlayerData.camera.playerBox && explosionRadius.intersectsMesh(this._PlayerData.camera.playerBox)) {
            // Envoi à la fonction d'affectation des dégâts
            console.log('hit')
            this._PlayerData.getDamage(30)
          }

          // On positionne la sphère là où il y a eu impact
          explosionRadius.position = meshFound.pickedPoint
          // On fait en sorte que les explosions ne soient pas considérées pour le Ray de la roquette
          explosionRadius.isPickable = false
          // On crée un petit material orange
          explosionRadius.material = new BABYLON.StandardMaterial("textureExplosion", this.scene)
          explosionRadius.material.diffuseColor = new BABYLON.Color3(1, 0.6, 0)
          explosionRadius.material.specularColor = new BABYLON.Color3(0, 0, 0)
          explosionRadius.material.alpha = 0.8
          // Chaque frame, on baisse l'opacité et on efface l'objet quand l'alpha est arrivé à 0
          explosionRadius.registerAfterRender(function () {
            explosionRadius.material.alpha -= 0.02
            if (explosionRadius.material.alpha <= 0) {
              explosionRadius.dispose()
            }
          });
        }
        this._rockets[i].dispose();
        // On enlève de l'array _rockets le mesh numéro i (défini par la boucle)
        this._rockets.splice(i,1)
      } else {
        let relativeSpeed = 1 / ((this.fps)/60)
        this._rockets[i].position.addInPlace(this._rockets[i].direction.scale(relativeSpeed))
      }
    }
  },
  renderExplosionRadius: function () {
    for (let i = 0; i < this._explosionRadius.length; i++) {
      for (let i = 0; i < this._explosionRadius.length; i++) {
        this._explosionRadius[i].material.alpha -= 0.02;
        if(this._explosionRadius[i].material.alpha<=0){
          this._explosionRadius[i].dispose();
          this._explosionRadius.splice(i, 1);
        }
      }
    }
  }
}

/**
 * TRANSFO DE DEGRES/RADIANS
 */
function degToRad (deg) {
  return (Math.PI*deg)/180
}

function radToDeg (rad) {
  // return (Math.PI*deg)/180
  return (rad*180)/Math.PI
}



