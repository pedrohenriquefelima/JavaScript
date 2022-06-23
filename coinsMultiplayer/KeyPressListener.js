class KeyPressListener {
    constructor(keyCode, callback) {
      //keySafe ensures the won't be called back if the user keeps pressing the arrow without releasing it
      let keySafe = true;
      this.keydownFunction = function(event) {
        console.log('event ' + event);
        if (event.code === keyCode) {
           if (keySafe) {
              keySafe = false;
              callback();
           }  
        }
     };
     this.keyupFunction = function(event) {
        //after the callback is called the programs inform the user has released the key
        if (event.code === keyCode) {
           keySafe = true;
        }         
     };
     document.addEventListener("keydown", this.keydownFunction);
     document.addEventListener("keyup", this.keyupFunction);
    }
  
    unbind() { 
      document.removeEventListener("keydown", this.keydownFunction);
      document.removeEventListener("keyup", this.keyupFunction);
    }
  }