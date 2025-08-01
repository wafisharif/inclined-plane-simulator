const PIXELS_PER_METER = 100;
let massSlider, angleSlider, muSlider;
let block, rampAngle, frictionEnabled;
let gravity = 9.8;
let velocity = 0;
let acceleration = 0;
let paused = false;
let elapsedTime = 0;
let lastUpdateTime = 0;

let slowMotion = false;
const slowMoFactor = 0.25;

// New variables to store final stats just before simulation ends
let preEndAcceleration = 0;
let preEndVelocity = 0;
let finalAcceleration = 0;
let finalVelocity = 0;
let finalTime = 0;

function setup() {
  createCanvas(800, 400);
  angleMode(DEGREES);

  massSlider = select('#massSlider');
  angleSlider = select('#angleSlider');
  muSlider = select('#muSlider');

  let slowToggle = select('#slowToggle');
  if (slowToggle) {
    slowToggle.changed(() => {
      slowMotion = slowToggle.checked();
    });
  }

  resetBlock();

  let explanationPanel = select('#explanationPanel');
let explanationToggle = select('#explanationToggle');

explanationToggle.mousePressed(() => {
  explanationPanel.toggleClass('hidden');
  if (explanationPanel.hasClass('hidden')) {
    explanationToggle.html('ℹ️ Explanation');
  } else {
    explanationToggle.html('Hide Explanation');
  }
});

}

function resetBlock() {
  velocity = 0;
  acceleration = 0;
  block = {
    baseX: 200,
    baseY: 300,
    d: 0,
    mass: parseFloat(massSlider.value())
  };
  elapsedTime = 0;
  lastUpdateTime = millis();
  paused = true;

  // Reset final stats
  preEndAcceleration = 0;
  preEndVelocity = 0;
  finalAcceleration = 0;
  finalVelocity = 0;
  finalTime = 0;
}

function drawRamp(angle) {
  push();
  translate(200, 300);
  rotate(-angle);
  fill(100);
  rect(0, 0, 400, 20);
  pop();
}

function drawBlockOnRamp(block, angle) {
  push();
  translate(block.baseX, block.baseY);
  rotate(-angle);
  fill('#44aaff');
  rect(block.d - 20, -40, 40, 40);
  pop();
}

function drawScaleBar() {
  push();
  stroke(255);
  strokeWeight(2);
  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  let x = 20;
  let y = 40;
  line(x, y, x + PIXELS_PER_METER, y);
  line(x, y - 5, x, y + 5);
  line(x + PIXELS_PER_METER, y - 5, x + PIXELS_PER_METER, y + 5);
  text("1 meter", x + PIXELS_PER_METER + 10, y);
  pop();
}

function draw() {
  background(20);

  let m = parseFloat(massSlider.value());
  rampAngle = parseFloat(angleSlider.value());
  let mu = parseFloat(muSlider.value());
  block.mass = m;

  select('#massValue').html(m);
  select('#angleValue').html(rampAngle);
  select('#muValue').html(mu.toFixed(2));

  let fg = m * gravity;
  let fParallel = fg * sin(rampAngle);
  let fPerpendicular = fg * cos(rampAngle);
  let fFriction = mu * fPerpendicular;
  let netForce = 0;

  if (!paused) {
    let currentTime = millis();
    let deltaTime = (currentTime - lastUpdateTime) / 1000;
    if (slowMotion) deltaTime *= slowMoFactor;
    elapsedTime += deltaTime;
    lastUpdateTime = currentTime;

    if (rampAngle === 0) {
      if (Math.abs(velocity) < 0.5) {
        velocity = 0;
        acceleration = 0;
      } else {
        let fFrictionFlat = mu * fg;
        let direction = velocity > 0 ? -1 : 1;
        netForce = direction * fFrictionFlat;
        acceleration = netForce / m;
        acceleration *= PIXELS_PER_METER;
        velocity += acceleration * deltaTime;
        if (Math.abs(velocity) < 0.5) {
          velocity = 0;
          acceleration = 0;
        }
      }
    } else {
      netForce = fParallel - fFriction;
      acceleration = netForce / m;
      acceleration *= PIXELS_PER_METER;
      velocity += acceleration * deltaTime;
    }

    // Save pre-end acceleration and velocity
    preEndAcceleration = acceleration;
    preEndVelocity = velocity;

    block.d += velocity * deltaTime;

    if (block.d < 0) {
      block.d = 0;
      velocity = 0;
      acceleration = 0;
    }

    if (block.d > 400) {
      block.d = 400;
      velocity = 0;
      acceleration = 0;
      paused = true;

      // Store the final stats as pre-end values
      finalAcceleration = preEndAcceleration;
      finalVelocity = preEndVelocity;
      finalTime = elapsedTime;
    }
  } else {
    lastUpdateTime = millis();
  }

  drawRamp(rampAngle);
  drawBlockOnRamp(block, rampAngle);
  drawScaleBar();

  if (paused) {
    push();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    if (block.d >= 400) {
      text("Simulation Complete - Press SPACE to Reset", width / 2, height / 2);
    } else {
      text("PAUSED - Press SPACE to Resume", width / 2, height / 2);
    }
    pop();
  }

  const velocity_m = velocity / PIXELS_PER_METER;
  const acceleration_m = acceleration / PIXELS_PER_METER;

  select('#accText').html(acceleration_m.toFixed(2) + " m/s²");
  select('#velText').html(velocity_m.toFixed(2) + " m/s");

  push();
  fill(255);
  textSize(16);
  textAlign(RIGHT, BOTTOM);
  text(`Time: ${elapsedTime.toFixed(2)} s`, width - 20, height - 20);
  pop();

  // Display final stats just before simulation ended
  if (paused && block.d >= 400) {
    push();
    fill('#ffcc00');
    textAlign(RIGHT, TOP);
    textSize(14);
    const margin = 20;
    const xPos = width - margin;
    const yPos = margin;

    text("Simulation Complete", xPos, yPos);
    text(`Final Acceleration: ${(finalAcceleration / PIXELS_PER_METER).toFixed(2)} m/s²`, xPos, yPos + 20);
    text(`Final Velocity: ${(finalVelocity / PIXELS_PER_METER).toFixed(2)} m/s`, xPos, yPos + 40);
    text(`Elapsed Time: ${finalTime.toFixed(2)} s`, xPos, yPos + 60);
    pop();
  }
}

function keyPressed() {
  if (key === ' ') {
    let activeTag = document.activeElement.tagName;
    if (activeTag === "INPUT" || activeTag === "BUTTON" || activeTag === "SELECT") {
      document.activeElement.blur();
      return false;
    }

    if (block.d >= 400) {
      resetBlock();
    } else {
      paused = !paused;
    }
    return false;
  }

  if (key === 'Shift') {
    slowMotion = !slowMotion;
    let toggle = select('#slowToggle');
    if (toggle) toggle.elt.checked = slowMotion;
  }
}
