let capturer;
let btn;
function record() {
  capturer = new CCapture({
    format: "webm",
    framerate: 24
  });
capturer.start();
btn.textContent = "stop recording";
btn.onclick = e => {
capturer.stop();
capturer.save();
capturer = null;
btn.textContent = "start recording";
btn.onclick = record;
}
}

let line
function setup() {
  createCanvas(800, 800)
  line = new DiffLine(20)   
  background(255)

  frameRate(24)
  btn = document.createElement("button");
  btn.textContent = "start recording";
  document.body.appendChild(btn);
  btn.onclick = record;
//btn.click(); //start recording automatically
}

function draw() {
  line.run() 
  if (capturer) capturer.capture(document.getElementById("defaultCanvas0"))}

let noiseScale=0.02;

function DiffLine(n){
  this.nodes = []
  this.x = width/2
  this.y = height/2 
  this.r = 100
 
  this.desiredSeparation = 100
  this.attractionRadius = 80
  this.desiredEdgeLen = 70
  
  this.maxForce = 0.2;
  this.maxSpeed = 2;
   
  for(var i=0;i<n;i++){     
    this.nodes.push(new Node(this.x+this.r*sin(TWO_PI*i/n),this.y+this.r*cos(TWO_PI*i/n)))
  } 

this.render = function() {   
noFill()
  strokeWeight(2)
 
  stroke(color(abs((frameCount/2)%500-225)+50,abs((frameCount/3)%400-200),abs((frameCount/3)%300-150))) //whoa nice      
    beginShape()
    curveVertex(this.nodes[0].pos.x,this.nodes[0].pos.y)     
    for(var i=0;i<this.nodes.length;i++)
        curveVertex(this.nodes[i].pos.x, this.nodes[i].pos.y)   
    curveVertex(this.nodes[0].pos.x,this.nodes[0].pos.y)
    curveVertex(this.nodes[0].pos.x,this.nodes[0].pos.y) 
    endShape()} 
  
this.addNode = function(node,num){  
  this.nodes.splice(num, 0, node)   
  }
  
this.updateNodes = function(){
     for(var i=0;i<this.nodes.length;i++){
     this.nodes[i].update() 
       
    let noiseVal = noise(this.nodes[i].pos.x*noiseScale, this.nodes[i].pos.y*noiseScale)
    this.nodes[i].maxForce = this.maxForce*noiseVal
    this.nodes[i].maxSpeed = this.maxSpeed*noiseVal
    noiseVal = pow(noiseVal,2)+0.05
          
    this.nodes[i].desiredSeparation = this.desiredSeparation*noiseVal
    this.nodes[i].attractionRadius = this.attractionRadius*noiseVal
    this.nodes[i].desiredEdgeLen = this.desiredEdgeLen*noiseVal      
     }   
  } 
  
this.attract = function(){
  
  let len = this.nodes.length
  let nodePrev
  let nodeNext

  for(var i=0;i<len;i++){
    let sum = createVector(0,0)
    
    // define Prev and Next neighbours   
    if (i == 0){
      nodePrev = len-1
      nodeNext = 1 } 
    else if (i==len - 1){
      nodePrev = len-2
      nodeNext = 0  }
    else{
     nodePrev = i-1
     nodeNext = i+1} 
    
   sum.add(this.nodes[nodePrev].pos).add(this.nodes[nodeNext].pos).div(2)
    
   let d1= this.nodes[i].pos.dist(this.nodes[nodePrev].pos)
   let d2 = this.nodes[i].pos.dist(this.nodes[nodeNext].pos)
   let dist =this.nodes[nodePrev].pos.dist(this.nodes[nodeNext].pos)  
   let desired = sum.sub(this.nodes[i].pos)
     
   desired.limit(this.nodes[i].maxSpeed)
   let steer = desired.sub(this.nodes[i].velocity)
   steer.limit(this.nodes[i].maxForce) 
  
   if(d1+d2<this.nodes[i].attractionRadius && dist<this.nodes[i].attractionRadius)              this.nodes[i].attractionForce.add(steer)      
    }  
  } 
  
this.separate = function(){
  let len = this.nodes.length
  for(var i=0;i<len;i++)  {
    let steer = createVector(0,0) 
    let desired = createVector(0,0) 
  
    for(var j=0;j<len;j++)   
    if(i!=j){ 
      let d = this.nodes[i].pos.dist(this.nodes[j].pos) 
      let avgSeparation =        (this.nodes[i].desiredSeparation+this.nodes[j].desiredSeparation)/2.0
 
  //separation within avg separation radius 
  if(d < avgSeparation){   
     let dif = this.nodes[i].pos.copy().sub(this.nodes[j].pos)
     dif.normalize()
     dif.div((d))   
     desired.add(dif)   
    }    
    }
      
    desired.limit(this.nodes[i].maxSpeed)
    steer = desired.sub(this.nodes[i].velocity)
    steer.limit(this.nodes[i].maxForce)
    this.nodes[i].separationForce.add(steer) 
    }
  } 
  
this.growth = function(){
  if(frameCount%30==0){   
    let idx_array = [] 
    let nodes_array = []
  
  for(var i=0;i<this.nodes.length;i++){  
    let node2 = (i==this.nodes.length-1)?0:i+1
    let d = this.nodes[i].pos.dist(this.nodes[node2].pos)     
      if (d>this.nodes[i].desiredEdgeLen){       
      let tempVec=this.nodes[i].pos.copy().add(this.nodes[node2].pos).div(2)
      let node = new Node(tempVec.x,tempVec.y)
      idx_array.push(i) 
      nodes_array.push(node)
    } 
  }
    for (var idx1=0;idx1<idx_array.length;idx1++)
      this.addNode(nodes_array[idx1],idx_array[idx1]+1+idx1) 
      }
  }
  
this.run = function(){    
    this.separate()  
    this.attract() 
    this.growth()   
    this.updateNodes()
    this.render()}
}

function Node(x,y){
  this.pos = createVector(x, y)
  this.velocity =createVector(0,0);
  this.acceleration = createVector(0.0,0.0)
  
  this.separationForce = createVector(0,0)
  this.attractionForce = createVector(0,0)
  
  this.applyForce = function(force) {
    this.acceleration.add(force)}
 
  this.update = function(){
    this.applyForce(this.separationForce)
    this.applyForce(this.attractionForce)  
    this.velocity.add(this.acceleration)
    this.pos.add(this.velocity)  
   
    this.acceleration.mult(0)  
    this.separationForce.mult(0)  
    this.attractionForce.mult(0)}}

function keyPressed(){
  if (key=='s') saveFrames('frame'+frameCount, 'png', 1, 1)}