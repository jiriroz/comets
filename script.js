function sketchProc(processing) {
/*2D interactive comet simulator. Author Jiri Roznovjak*/
var WIDTH = 1200;
var HEIGHT = 600;
processing.size(WIDTH,HEIGHT);
document.getElementById('canvas1').style.width = WIDTH;
document.getElementById('canvas1').style.height = HEIGHT;
var ARROW = processing.loadImage('arrow.png'); //260x260px
var G = 1000; //gravitational constant
var DRAGGING = false;
var PRESSPOINT;
var STARS,COMETS;
var VAPORIZING = false; //is comet vaporizing when it gets close to a star?

var Particle = function () {
	this.position = new processing.PVector(0,0);
	this.velocity = new processing.PVector(0,0);
	this.acceleration = new processing.PVector(0,0);
	this.mass = 1;
	this.radius = 1;
	this.color = processing.color(255,255,255);
	this.opacity = 255;
	this.alive = true;
};

Particle.prototype.run = function () {
	this.update();
	this.display();
};

Particle.prototype.update = function () {
	this.velocity.add(this.acceleration);
	this.position.add(this.velocity);
	this.acceleration.mult(0);
};

Particle.prototype.display = function () {
	processing.noStroke();
	processing.fill(this.color,this.opacity);
	processing.ellipse(this.position.x,this.position.y,this.radius*2,this.radius*2);
};

Particle.prototype.applyForce = function (force) { //force as a pvector
	force.div(this.mass);
	this.acceleration.add(force);
};

Particle.prototype.calculateAttraction = function (object) {
	var force = PVector.sub(object.position,this.position);
	var distance = force.mag();
	if (distance < 10) {distance = 10}
	force.normalize();
	var strength = (G * this.mass * object.mass) / (distance * distance);
	force.mult(strength);
	return force;
};

var Star = function(x,y,velx,vely,mass) {
    Particle.call(this);
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(velx,vely);
	this.color = processing.color(255,255,50);
	this.opacity = 50;
	this.mass = mass;
};

Star.prototype = Object.create(Particle.prototype);

Star.prototype.display = function () {
	this.radius = 15 + 3*this.mass;
	processing.noStroke();
	for (var rad=0;rad<this.radius;rad++) {
		processing.fill(this.color,this.opacity);
		processing.ellipse(this.position.x,this.position.y,rad*2,rad*2);
	}
};

Star.prototype.merge = function (star2) {
	if (this.mass < star2.mass) {
		return
	}
	var distance = calculateDistance(this.position,star2.position);
	if (distance < this.radius + star2.radius) {
		this.mass += star2.mass;
		star2.alive = false;
		var adVel = star2.velocity;
		adVel.mult(star2.mass/this.mass);
		this.velocity.add(adVel);
	}
};

var Comet = function(x,y,velx,vely) {
    Particle.call(this);
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector(velx,vely);
	this.radius = 4;
	this.mass = 100;
	this.tail = new Tail();
};

Comet.prototype = Object.create(Particle.prototype);

Comet.prototype.runCometAndTail = function (star) {
	if (this.isAlive()) {
		this.run(star);
	}
	this.runTail(star);
};

Comet.prototype.run = function (star) {
	var gravity = this.calculateAttraction(star);
	this.applyForce(gravity);
	this.update(star);
	this.display();
};

Comet.prototype.runTail = function (star) {
	var opacity = this.determineDustOpacity(star);
	if (this.isAlive()) {
		this.tail.addDust(this.position.x,this.position.y,opacity);
		}
	this.tail.update();
	this.decreaseMass(star);
};

Comet.prototype.update = function (star) {
	this.velocity.add(this.acceleration);
	this.position.add(this.velocity);
	this.acceleration.mult(0);
	this.radius = 1 + 2*(this.mass/100);
	if (this.checkInStar(star) || this.checkOffScreen()) {
		this.alive = false;
	}
};

Comet.prototype.checkOffScreen = function () {
	if (this.position.x < -100 || this.position.x > WIDTH + 100 || this.position.y < -100 || this.position.y > HEIGHT + 100) {
		return true;
	}
	return false;
};

Comet.prototype.checkInStar = function (star) {
	return (calculateDistance(this.position,star.position) < star.radius);
};

Comet.prototype.determineDustOpacity = function (star) {
	var distance = calculateDistance(this.position,star.position);
	var opacity = 200 * (150 / distance);
	if (opacity > 200) {opacity = 200}
	return opacity;
};

 //decreases comet's mass based on its proximity to the star
Comet.prototype.decreaseMass = function (star) {
	var distance = calculateDistance(this.position,star.position);
	this.mass -= 2000 / (distance*distance);
	if (this.mass == 0) {this.mass = -1;}
};

Comet.prototype.isAlive = function () {
	if (!this.alive) {
		return false;
	}
	if (this.mass < 0 && VAPORIZING) { //vaporizing turned off
		return false;
	}
	return true;
};

var Tail = function () {
	this.dustArray = [];
	this.color = processing.color(220,220,220);
};

Tail.prototype.addDust = function (x,y,opacity) {
	for (var i=0;i<5/STARS.length;i++) {
		this.dustArray.push(new DustParticle(x,y,opacity));
	}
};

Tail.prototype.update = function () {
	for (var i=0; i<this.dustArray.length;i++) {
		this.dustArray[i].run();
		if (this.dustArray[i].checkInvisible()) {
			this.dustArray.splice(i,1);
		}
	}
};

var DustParticle = function(x,y,opacity) {
    Particle.call(this);
	this.position = new processing.PVector(x,y);
	this.velocity = new processing.PVector((Math.random()-0.5)*0.6,(Math.random()-0.5)*0.6);
	this.color = processing.color(220,220,220);
	this.opacity = opacity;
	this.radius = 3;
	this.drift = 0.95;
};

DustParticle.prototype = Object.create(Particle.prototype);

DustParticle.prototype.run = function () {
	this.update();
	this.opacity -= 4;
	this.display();
};

DustParticle.prototype.update = function () {
	Particle.prototype.update.call(this);
	this.velocity.mult(this.drift);
};


DustParticle.prototype.checkInvisible = function () {
	if (this.opacity < 0) {
		return true;
	}
};

var createComet = function () {
	var currentPoint = new processing.PVector(processing.mouseX,processing.mouseY);
	var velocity = PVector.sub(PRESSPOINT,currentPoint);
	velocity.div(40);
	COMETS.push(new Comet(PRESSPOINT.x,PRESSPOINT.y,velocity.x,velocity.y));
};

var createStar = function () {
	var currentPoint = new processing.PVector(processing.mouseX,processing.mouseY);
	var velocity = PVector.sub(PRESSPOINT,currentPoint);
	velocity.div(40);
	STARS.push(new Star(processing.mouseX,processing.mouseY,velocity.x,velocity.y,1));
};

var displayArrow = function () {
	var distance = calculateDistance(PRESSPOINT,new processing.PVector(processing.mouseX,processing.mouseY));
	var angle = calculateAngle(PRESSPOINT,new processing.PVector(processing.mouseX,processing.mouseY));
	angle -= Math.PI/4;
	if (distance > 120) {distance = 120;} //constraining distance
	var size = (distance / Math.sqrt(2))*1.1;
	if (size == 0) {size = 1;} //if size is 0 it automatically displays a full scale image
	processing.pushMatrix();
	processing.translate(PRESSPOINT.x,PRESSPOINT.y);
	processing.rotate(angle);
	processing.image(ARROW,0,0,size,size);
	processing.popMatrix();
};

var calculateAngle = function (point2,point1) {
	var angle = 0;
	var dx = point1.x - point2.x;
	var dy = point1.y - point2.y;
	if (dx < 0) {angle -= Math.PI;}
	angle += Math.atan(dy/dx);
	return angle;
};


var calculateDistance = function (position1,position2) {
	var dir = PVector.sub(position2,position1);
	return dir.mag();
};

var setupAnimation = function (scenario) {
	COMETS = [];
	switch (scenario) {
		case "0": //one star in the middle
			STARS = [new Star(WIDTH/2,HEIGHT/2,0,0,2)];
			break;
		case "1": //binary with two same stars
			var sideVelocitySmall = Math.random()*0.5 + 1;
			var sideVelocityBig = 6;
			STARS = [new Star(WIDTH/2,HEIGHT/2-200,sideVelocitySmall,0,2),new Star(WIDTH/2,HEIGHT/2+200,-sideVelocitySmall,0,2)];
			break;
		case "2": //one massive and two dwarf stars
			var sideVelocitySmall = Math.random()*0.5 + 1;
			var sideVelocityBig = 6;
			STARS = [new Star(WIDTH/2,HEIGHT/2,0,0,8),new Star(WIDTH/2-40,HEIGHT/2-250,sideVelocityBig,-sideVelocitySmall,0.15),new Star(WIDTH/2+30,HEIGHT/2-250,sideVelocityBig,sideVelocitySmall,0.15)];
			break;
		default: //one star in the middle (executed after start)
			STARS = [new Star(WIDTH/2,HEIGHT/2,0,0,2)];
	}
};

var animationMainloop = function () {
	processing.background(18,24,64);
	for (var i=0; i<COMETS.length;i++) {
		for (var j=0; j<STARS.length; j++) {
			COMETS[i].runCometAndTail(STARS[j]);
		}
	}
	for (var i=0; i<STARS.length; i++) {
		for (var j=0; j<STARS.length; j++) {
			if (j!=i) {
				var gravity = STARS[i].calculateAttraction(STARS[j]);
				STARS[i].applyForce(gravity);
				STARS[i].merge(STARS[j]);
			}
		}
		STARS[i].run();
		if (!STARS[i].alive) {
			STARS.splice(i,1);
			if (i != STARS.length) {
				i--;
			}
		}
	}
};

processing.draw = function () {
	if (RESET) {
		setupAnimation(SCENARIO);
		RESET = false;
	}
	animationMainloop();
	if (DRAGGING) {
		displayArrow();
	}
};

processing.mousePressed = function () {
	PRESSPOINT = new processing.PVector(processing.mouseX,processing.mouseY);
	DRAGGING = true;
};

processing.mouseReleased = function () {
	//createStar();
	createComet();
	DRAGGING = false;
};

setupAnimation(SCENARIO);
}
var canvas = document.getElementById("canvas1");
var p = new Processing(canvas, sketchProc);
