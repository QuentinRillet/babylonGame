Weapons = function(Player) {
  this.Player = Player
  this.Armory = Player.game.armory
  this.bottomPosition = new BABYLON.Vector3(0.5,-2.5,1)
  this.topPositionY = -0.5
  this.inventory = []

  this.inventory[0] = this.newWeapon('Crook');

  this.inventory[1] = this.newWeapon('Ezekiel');

  // Notre arme actuelle est Ezekiel, qui se trouve en deuxième position
  // dans le tableau des armes dans Armory
  this.actualWeapon = this.inventory.length -1;

  // On dis que notre arme en main est l'arme active
  this.inventory[this.actualWeapon].isActive = true;

  // On dis que la cadence est celle de l'arme actuelle (grace à typeWeapon)
  this.fireRate = this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency;

  this._deltaFireRate = this.fireRate;

  this.canFire = true;

  this.launchBullets = false;
  let _this = this
  // Engine va nous être utile pour la cadence de tir
  let engine = Player.game.scene.getEngine()

  Player.game.scene.registerBeforeRender(() => {
    if (!_this.canFire) {
      _this._deltaFireRate -= engine.getDeltaTime()
      if (_this._deltaFireRate <= 0  && _this.Player.isAlive) {
        _this.canFire = true
        _this._deltaFireRate = _this.fireRate
      }
    }
  })
}

Weapons.prototype = {
  newWeapon: function (typeWeapon) {
    let newWeapon;
    for (let i = 0; i < this.Armory.weapons.length; i++) {
      if(this.Armory.weapons[i].name === typeWeapon){
        newWeapon = BABYLON.Mesh.CreateBox('rocketLauncher', 0.5, this.Player.game.scene)
        // Nous faisons en sorte d'avoir une arme d'apparence plus longue que large
        newWeapon.scaling = new BABYLON.Vector3(1,0.7,2)

        // On l'associe à la caméra pour qu'il bouge de la même facon
        newWeapon.parent = this.Player.camera

        // On positionne le mesh APRES l'avoir attaché à la caméra
        newWeapon.position = this.bottomPosition.clone()
        newWeapon.isPickable = false

        // Ajoutons un material de l'arme pour le rendre plus visible
        let materialWeapon = new BABYLON.StandardMaterial('rocketLauncherMat', this.Player.game.scene)
        materialWeapon.diffuseColor=this.Armory.weapons[i].setup.colorMesh
        newWeapon.material = materialWeapon
        newWeapon.typeWeapon = i
        newWeapon.isActive = false
        break;
      }else if(i === this.Armory.weapons.length -1){
        console.log('UNKNOWN WEAPON')
      }
    }

    return newWeapon
  },
  fire: function (pickInfo) {
    this.launchBullets = true
  },
  stopFire: function(pickInfo) {
    this.launchBullets = false
  },
  launchFire: function () {
    if (this.canFire) {
      // Id de l'arme en main
      let idWeapon = this.inventory[this.actualWeapon].typeWeapon

      // Détermine la taille de l'écran
      let renderWidth = this.Player.game.engine.getRenderWidth(true)
      let renderHeight = this.Player.game.engine.getRenderHeight(true)

      // Cast un rayon au centre de l'écran
      let direction = this.Player.game.scene.pick(renderWidth/2,renderHeight/2,function (item) {
        return !(item.name == "weapon" || item.id == "headMainPlayer" || item.id == "hitBoxPlayer")
      });
      // Si l'arme est une arme de distance
      if(this.Armory.weapons[idWeapon].type === 'ranged'){
        if(this.Armory.weapons[idWeapon].setup.ammos.type === 'rocket'){
          direction = direction.pickedPoint.subtractInPlace(this.inventory[this.actualWeapon].absolutePosition.clone())
          direction = direction.normalize()
          // On crée la roquette
          this.createRocket(this.Player.camera.playerBox,direction)
        }else if(this.Armory.weapons[idWeapon].setup.ammos.type === 'bullet'){
          this.shootBullet(direction)
        }else{
          this.createLaser(direction)
        }
      }else{
        this.hitHand(direction)
      }
      this.canFire = false
    } else {
      // Nothing to do : cannot fire
    }
  },
  createRocket: function(playerPosition, direction) {
    let positionValue = this.inventory[this.actualWeapon].absolutePosition.clone();
    let rotationValue = playerPosition.rotation
    let Player = this.Player
    let newRocket = BABYLON.Mesh.CreateBox("rocket", 1, Player.game.scene)
    // Permet de connaitre l'id de l'arme dans Armory.js
    let idWeapon = this.inventory[this.actualWeapon].typeWeapon

    // Les paramètres de l'arme
    let setupRocket = this.Armory.weapons[idWeapon].setup.ammos
    newRocket.direction = direction

    newRocket.position = new BABYLON.Vector3(
      positionValue.x + (newRocket.direction.x * 1) ,
      positionValue.y + (newRocket.direction.y * 1) ,
      positionValue.z + (newRocket.direction.z * 1))
    newRocket.rotation = new BABYLON.Vector3(rotationValue.x,rotationValue.y,rotationValue.z)
    newRocket.scaling = new BABYLON.Vector3(0.5,0.5,1)
    newRocket.material = new BABYLON.StandardMaterial("textureWeapon", this.Player.game.scene)
    newRocket.material.diffuseColor = this.Armory.weapons[idWeapon].setup.colorMesh
    newRocket.paramsRocket = this.Armory.weapons[idWeapon].setup

    newRocket.isPickable = false

    this.Player.game._rockets.push(newRocket)
  },
  shootBullet : function(meshFound) {
    // Permet de connaitre l'id de l'arme dans Armory.js
    let idWeapon = this.inventory[this.actualWeapon].typeWeapon

    let setupWeapon = this.Armory.weapons[idWeapon].setup

    if (meshFound.hit && meshFound.pickedMesh.isPlayer) {
      // On a touché un joueur
    } else {
      // L'arme ne touche pas de joueur
      console.log('Not Hit Bullet')
    }
  },
  createLaser : function(meshFound) {
    // Permet de connaitre l'id de l'arme dans Armory.js
    let idWeapon = this.inventory[this.actualWeapon].typeWeapon

    let setupLaser = this.Armory.weapons[idWeapon].setup.ammos

    let positionValue = this.inventory[this.actualWeapon].absolutePosition.clone()

    if (meshFound.hit) {

      let laserPosition = positionValue;
      // On crée une ligne tracé entre le pickedPoint et le canon de l'arme
      let line = BABYLON.Mesh.CreateLines("lines", [
        laserPosition,
        meshFound.pickedPoint
      ], this.Player.game.scene)
      // On donne une couleur aléatoire
      let colorLine = new BABYLON.Color3(Math.random(), Math.random(), Math.random())
      line.color = colorLine

      // On élargis le trait pour le rendre visible
      line.enableEdgesRendering()
      line.isPickable = false
      line.edgesWidth = 40.0
      line.edgesColor = new BABYLON.Color4(colorLine.r, colorLine.g, colorLine.b, 1)
      if (meshFound.pickedMesh.isPlayer) {
        // On inflige des dégats au joueur
      }
      this.Player.game._lasers.push(line)
    }
  },
  hitHand : function(meshFound) {
    // Permet de connaitre l'id de l'arme dans Armory.js
    let idWeapon = this.inventory[this.actualWeapon].typeWeapon

    let setupWeapon = this.Armory.weapons[idWeapon].setup

    if (meshFound.hit && meshFound.distance < setupWeapon.range*5 && meshFound.pickedMesh.isPlayer) {
      // On a touché un joueur
    } else {
      // L'arme frappe dans le vide
      console.log('Not Hit CaC')
    }
  },
  nextWeapon : function(way) {
    // On définis armoryWeapons pour accéder plus facilement à Armory
    let armoryWeapons = this.Armory.weapons

    // On dit qur l'arme suivante est logiquement l'arme plus le sens donné
    let nextWeapon = this.inventory[this.actualWeapon].typeWeapon + way

    //on définis actuellement l'arme possible utilisable a 0 pour l'instant
    let nextPossibleWeapon = null

    // Si le sens est positif
    if(way>0){
      // La boucle commence depuis nextWeapon
      for (let i = nextWeapon; i < nextWeapon + this.Armory.weapons.length; i++) {
        // L'arme qu'on va tester sera un modulo de i et de la longueur de Weapon
        let numberWeapon = i % this.Armory.weapons.length
        // On compare ce nombre au armes qu'on a dans l'inventaire
        for (let y = 0; y < this.inventory.length; y++) {
          if (this.inventory[y].typeWeapon === numberWeapon) {
            // Si on trouve quelque chose, c'est donnc une arme qui vient arès la notre
            nextPossibleWeapon = y
            break;
          }
        }
        // Si on a trouvé une arme correspondante, on a plus besoin de la boucle for
        if (nextPossibleWeapon != null) {
          break;
        }
      }
    }else{
      for (let i = nextWeapon; ; i--) {
        if (i < 0) {
          i = this.Armory.weapons.length;
        }
        let numberWeapon = i;
        for (let y = 0; y < this.inventory.length; y++) {
          if(this.inventory[y].typeWeapon === numberWeapon){
            nextPossibleWeapon = y;
            break;
          }
        }
        if (nextPossibleWeapon != null) {
          break;
        }
      }
    }
    if (this.actualWeapon != nextPossibleWeapon) {
      // On dit a notre arme actuelle qu'elle n'est plus active
      this.inventory[this.actualWeapon].isActive = false
      // On change l'arme actuelle avec celle qu'on a trouvé
      this.actualWeapon = nextPossibleWeapon
      // On dit a notre arme choisi qu'elle est l'arme active
      this.inventory[this.actualWeapon].isActive = true

      // On actualise la cadence de l'arme l'arme
      this.fireRate = this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency
      this._deltaFireRate = this.fireRate
    }
  }
}