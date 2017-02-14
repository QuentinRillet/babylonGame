function Player (game, canvas) {
  let _this = this
  this.game = game

  this.axisMovement = [false,false,false,false]

  window.addEventListener("keyup", (evt) => {
    switch(evt.keyCode){
      case 90:
        _this.camera.axisMovement[0] = false;
        break;
      case 83:
        _this.camera.axisMovement[1] = false;
        break;
      case 81:
        _this.camera.axisMovement[2] = false;
        break;
      case 68:
        _this.camera.axisMovement[3] = false;
        break;
    }
  }, false)

  // Quand les touches sont relachés
  window.addEventListener("keydown", (evt) => {
    switch(evt.keyCode){
      case 90:
        _this.camera.axisMovement[0] = true;
        break;
      case 83:
        _this.camera.axisMovement[1] = true;
        break;
      case 81:
        _this.camera.axisMovement[2] = true;
        break;
      case 68:
        _this.camera.axisMovement[3] = true;
        break;
    }
  }, false)


  // Initialisation de la caméra
  this._initCamera(this.game.scene, canvas)
}

Player.prototype = {
  _initCamera : function(scene, canvas) {
    this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(-20, 5, 0), scene)

    // Axe de mouvement X et Z
    this.camera.axisMovement = [false,false,false,false]


    this.isAlive = true

    // regarder au point zéro de la scène
    this.camera.setTarget(BABYLON.Vector3.Zero())

    // On affecte le mouvement de la caméra au canvas
    this.camera.attachControl(canvas, true)
  }
}