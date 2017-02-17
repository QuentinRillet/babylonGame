document.addEventListener("DOMContentLoaded", () => {
  new Game('renderCanvas')
}, false)

Game = function (canvasId) {
  let canvas = document.getElementById(canvasId)
  let engine = new BABYLON.Engine(canvas, true)
  this.engine = engine
  let _this = this
  _this.actualTime = Date.now()

  this.allSpawnPoints = [
    new BABYLON.Vector3(-20, 5, 0),
    new BABYLON.Vector3(0, 5, 0),
    new BABYLON.Vector3(20, 5, 0),
    new BABYLON.Vector3(-40, 5, 0)
  ]

  this.scene = this._initScene(engine)

  // Ajout de l'armurerie
  _this.armory = new Armory(this)
  // init de la camera et du décor
  let _player = new Player(_this)
  this._PlayerData = _player
  let _arena = new Arena(_this)

  this._rockets = []
  this._explosionRadius = []
  this._lasers = []

  // Core
  engine.runRenderLoop(() => {
    // Récuperer le ratio par les fps
    _this.fps = Math.round(1000/engine.getDeltaTime())

    // Checker le mouvement du joueur en lui envoyant le ratio de déplacement
    _player._checkMove((_this.fps)/60)

    _this.renderRockets()
    _this.renderExplosionRadius()

    _this.renderLaser()

    _this.renderWeapons()

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
        if(meshFound.pickedMesh && !meshFound.pickedMesh.isMain){
          // On crée une sphere qui représentera la zone d'impact
          let explosionRadius = BABYLON.Mesh.CreateSphere("sphere", 5.0, 20, this.scene)
          // On positionne la sphère la ou il y a eu impact
          explosionRadius.position = meshFound.pickedPoint
          // On fais en sorte que les explosions ne soit pas considéré pour le Ray de la roquette
          explosionRadius.isPickable = false
          // On crée un petit material orange
          explosionRadius.material = new BABYLON.StandardMaterial("textureExplosion", this.scene)
          explosionRadius.material.diffuseColor = new BABYLON.Color3(1,0.6,0)
          explosionRadius.material.specularColor = new BABYLON.Color3(0,0,0)
          explosionRadius.material.alpha = 0.8

          // Calcule la matrice de l'objet pour les collisions
          explosionRadius.computeWorldMatrix(true)

          // On fais un tour de bouche pour chaque joueur de la scène
          if (this._PlayerData.isAlive && this._PlayerData.camera.playerBox && explosionRadius.intersectsMesh(this._PlayerData.camera.playerBox)) {
            // Envoie a la fonction d'affectation des dégats
            this._PlayerData.getDamage(30)
          }

          this._explosionRadius.push(explosionRadius);
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
  },
  renderLaser : function() {
    if(this._lasers.length > 0){
      for (let i = 0; i < this._lasers.length; i++) {
        this._lasers[i].edgesWidth -= 0.5
        if(this._lasers[i].edgesWidth<=0){
          this._lasers[i].dispose()
          this._lasers.splice(i, 1)
        }
      }
    }
  },
  renderWeapons : function() {
    if(this._PlayerData && this._PlayerData.camera.weapons.inventory){
      // On regarde toute les armes dans inventory
      let inventoryWeapons = this._PlayerData.camera.weapons.inventory

      for (let i = 0; i < inventoryWeapons.length; i++) {
        // Si l'arme est active et n'est pas à la position haute (topPositionY)
        if(inventoryWeapons[i].isActive && inventoryWeapons[i].position.y < this._PlayerData.camera.weapons.topPositionY) {
          inventoryWeapons[i].position.y += 0.1
        } else if (!inventoryWeapons[i].isActive && inventoryWeapons[i].position.y != this._PlayerData.camera.weapons.bottomPosition.y) {
          // Sinon, si l'arme est inactive et oas encore à la position basse
          inventoryWeapons[i].position.y -= 0.1
        }
      }
    }
  },
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



