function Game (canvasId) {
  // private
  let canvas = document.getElementById(canvasId)
  let engine = new BABYLON.Engine(canvas, true)
  let _this = this

  // public
  this.scene = this._initScene(engine)

  // init de la camera et du décor
  let _player = new Player(_this, canvas)
  let _arena = new Arena(_this)

  // Core
  engine.runRenderLoop(() => {
    _this.scene.render()
  })

  // Adjusting
  window.addEventListener("resize", () => {
    if (engine) {
      engine.resize()
    }
  }, false)
}

Game.prototype = {
  //Init
  _initScene: (engine) => {
    let scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    return scene
  }
}
