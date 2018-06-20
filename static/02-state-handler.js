let Application = PIXI.Application,
  loader = PIXI.loader,
  resources = PIXI.loader.resources,
  Sprite = PIXI.Sprite,
  Rectangle = PIXI.Rectangle,
  Graphics = PIXI.Graphics;

let app = new Application({
  width: 512, 
  height: 512,
  antialias: true,
  transparent: false,
  backgroundColor: 0x061639,
  autoResize: true
});

document.body.appendChild(app.view);


//loader.load(setup);

function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } 
    else {
      //There's no collision on the y axis
      hit = false;
    }
  } 
  else {
    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

class Square extends Graphics {
  constructor(x, y, height, width, color) {
    super();
    this.beginFill(color);
    this.lineStyle(4, 0xFF3300, 1);

    this.drawRect(0, 0, height, width);
    this.endFill();

    this.x = x;
    this.y = y;
    this.vx = 1;
    this.vy = 1;
  }
}

let square, square1, state;

function setup(x, y) {
  // Sprite usage example.
  //cat = new Sprite(resources["images/published_sprite.json"].textures["Charactervecto1r.jpg"]);

  // Squares usage instead of sprite.
  square = new Square(x, y, 120, 120, 0x66CCFF);
  //square1 = new Square(300, 350, 64, 64, 0x9966FF);

  // Add everything.
  app.stage.addChild(square);
  //app.stage.addChild(square1);
}

let host = window.document.location.host.replace(/:.*/, '');

let client = new Colyseus.Client(location.protocol.replace("http", "ws") + host + (location.port ? ':' + location.port : ''));
let room = client.join("state_handler");
room.onJoin.add(function() {
  console.log(client.id, "joined", room.name);
});

let players = {};
let colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta'];

// listen to patches coming from the server
room.listen("players/:id", function(change) {
  if (change.operation === "add") {
    let dom = document.createElement("div");
    dom.className = "player";
    dom.style.left = change.value.x + "px";
    dom.style.top = change.value.y + "px";
    dom.style.background = colors[Math.floor(Math.random() * colors.length)];
    dom.innerHTML = `Player '${change.path.id}'`;

    players[change.path.id] = dom;
    document.body.appendChild(dom);

  } else if (change.operation === "remove") {
    document.body.removeChild(players[ change.path.id ]);
    delete players[change.path.id];
  }
});

room.listen("players/:id/:axis", function(change) {
  let dom = players[ change.path.id ];

  let styleAttribute = (change.path.axis === "x")
    ? "left"
    : "top";

  dom.style[ styleAttribute ] = change.value + "px";
});

room.listen("squares/:id/:attribute", function(change) {

  if(square) {
    if(change.path.attribute === "x")
      square.x = change.value;
    else if(change.path.attribute === "y")
      square.y = change.value;
  }
  else {
    loader.load(setup(100, 100));
  }
});

room.onMessage.add(function(message) {
  if(square){
    square.x = message[0];
    square.y = message[1];
  }
  else {
    loader.load(setup(message[0], message[1]));
  }
});

window.addEventListener("keydown", function (e) {
  console.log(e.which);
  if (e.which === 38) {
    up();

  } else if (e.which === 39) {
    right();

  } else if (e.which === 40) {
    down();

  } else if (e.which === 37) {
    left();
  }
});

function up () {
  room.send({ y: -1 });
}

function right () {
  room.send({ x: 1 });
}

function down () {
  room.send({ y: 1 });
  /*
  console.log('pushing new entities!');
  let size = Math.floor(Math.random() * 100);
  let locX = Math.floor(Math.random() * 400) + 100;
  let locY = Math.floor(Math.random() * 400) + 100;
  let color = "0x" + Math.floor(Math.random() * 99) + Math.floor(Math.random() * 99) + Math.floor(Math.random() * 99);
  entities.push(new Square(locX, locY, size, size, color));
  app.stage.addChild(entities[entities.length - 1]);
  */
}

function left () {
  room.send({ x: -1 });
}
