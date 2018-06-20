import { Room, EntityMap, Client, nosync } from "colyseus";
import { PIXI } from "node-pixi";

let Application = PIXI.Application,
  loader = PIXI.loader,
  resources = PIXI.loader.resources,
  Sprite = PIXI.Sprite,
  Rectangle = PIXI.Rectangle,
  Graphics = PIXI.Graphics;


let app = new Application({
  width:512,
  height: 512,
  antialias: true,
  transparent: false,
  autoResize: true
});

let shapes = [];
let state;

export class State {
    players: EntityMap<Player> = {};
  //squares: EntityMap<Square> = {};

    @nosync
    something = "This attribute won't be sent to the client-side";

    createShape(){
      shapes.push(new Shape(200, 300, 120, 120, 0x66CCFF));
    }

    createPlayer (id: string) {
        this.players[ id ] = new Player();
    }

    removePlayer (id: string) {
        delete this.players[ id ];
    }

    movePlayer (id: string, movement: any) {
        if (movement.x) {
            this.players[ id ].x += movement.x * 10;

        } else if (movement.y) {
            this.players[ id ].y += movement.y * 10;
        }
    }
}

export class Player {
    x = Math.floor(Math.random() * 400);
    y = Math.floor(Math.random() * 400);
}

function contain(shape) {

  shape.right = shape.x + shape.width;
  shape.bottom = shape.y + shape.height;

  if(shape.right > app.screen.width || shape.x < 0) {
    shape.vx = -shape.vx;
    if(shape.right > app.screen.width) {
      shape.x = app.screen.width - shape.width;
    }
    else {
      shape.x = 0;
    }
  }

  if(shape.bottom > app.screen.height || shape.y < 0) {
    shape.vy = -shape.vy;
    if(shape.bottom > app.screen.height){
      shape.y = app.screen.height - shape.height;
    }
    else {
      shape.y = 0;
    }
  }

  shape.x += shape.vx;
  shape.y += shape.vy;
}

class Shape extends Graphics {
  constructor(x, y, height, width, color) {
    super();
    this.beginFill(color);
    this.lineStyle(4, 0xFF3300, 1);

    this.drawRect(0, 0, height, width);

    this.x = x;
    this.y = y;
    this.vx = 1;
    this.vy = 1;
  }
}

export class Square {
  constructor(x, y) {
    x = x;
    y = y;
  }
}

function setup(room) {

  // Add everything.
  app.stage.addChild(shapes[0]);

  state = play;

  app.ticker.add(delta => gameLoop(delta, room));
}

function gameLoop(delta, room) {
  state(delta, room);
}

function play(delta, room) {
  contain(shapes[0]);

  //room.state.squares[1].x = shapes[0].x;
  //room.state.squares[1].y = shapes[0].y;

  room.broadcast([shapes[0].x, shapes[0].y]);
}

export class StateHandlerRoom extends Room<State> {

  onInit (options) {
    console.log("StateHandlerRoom created!", options);

    this.setState(new State());
    this.state.createShape();

    // We'll let PIXI handle the loop.
    loader.load(setup(this));

    //this.setSimulationInterval(() => this.update());
  }

  update() {
    console.log("simulating!");
  }

  onJoin (client) {
    this.state.createPlayer(client.sessionId);
  }

  onLeave (client) {
    this.state.removePlayer(client.sessionId);
  }

  onMessage (client, data) {
    console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
    this.state.movePlayer(client.sessionId, data); } 
  onDispose () {
    console.log("Dispose StateHandlerRoom");
  }

}
