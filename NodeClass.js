class Node {
  constructor(x, y, nodeTypeDNA) {
    this.x = x;
    this.y = y;

    this.speed = nodeTypeDNA.speed;
    this.size = nodeTypeDNA.size;
    this.shape = nodeTypeDNA.shape;
    this.colour = nodeTypeDNA.colour;
    this.behaviour = nodeTypeDNA.behaviour;
    this.dnaString = nodeTypeDNA.dnaString;
    this.dnaCharSeedValue = nodeTypeDNA.dnaCharSeedValue;
    this.speciesName = nodeTypeDNA.speciesName || "";
    this.connectionThreshold = nodeTypeDNA.connectionThreshold;
    this.connectionStyle = nodeTypeDNA.connectionStyle;
    // this.boundaryAlpha = 255;

    this.isPinned = false; // Being dragged around by the user

    this.posHistory = [];
    this.historyLength = int(random(20, 60)); // 80

    if (nodeTypeDNA.behaviour === "lissajous") {
      this.historyLength = int(random(60, 100));
    }

    if (nodeTypeDNA.behaviour === "colony") {
      this.historyLength = 0;
    }

    this.weaveHistory = [];
    this.weaveMaxHistory = 600;
    this.weaveJustWrapped = false;
    this.weaveMaxAge = 600;
    this.weaveDropInterval = 4;
    this.weaveDropCounter = 0;
    this.weavePulsePhase = random(TWO_PI);

    this.glowStyle = nodeTypeDNA.glowStyle;
    this.trailStyle = nodeTypeDNA.trailStyle;

    let rndStartingAngle = random(TWO_PI);
    this.rotation = rndStartingAngle;

    this.colonyGroupID = -1;
    this.colonyAnchorOffset = createVector(0, 0);
    this.bobPhase = random(TWO_PI);

    if (nodeTypeDNA.behaviour === "colony") {
      this.colonyGroupID = this.assignColonyGroup(x, y);
      this.colonyAnchorOffset = this.generateColonyOffset(this.colonyGroupID);
      this.historyLength = 0;
    }

    this.separationMultiplier = random(2, 5);

    // this.growthVector = p5.Vector.random2D().mult(this.speed);
    this.growthVector = p5.Vector.fromAngle(this.rotation);
    this.growthVector.setMag(this.speed);
    // this.growthSeed = random(1000);
    this.noiseOffset = random(10000);

    this.growthTarget = createVector(
      random(envX + 40, envX + envW - 40),
      random(envY + 40, envY + envH - 40)
    );

    this.orbitAngle = rndStartingAngle;
    this.orbitRadius = random(50, 250);

    this.orbitCentre = createVector(x, y);
    this.orbitCentre.x = constrain(
      x,
      sidebarWidth + this.orbitRadius,
      width - this.orbitRadius
    );
    this.orbitCentre.y = constrain(
      y,
      this.orbitRadius,
      height - this.orbitRadius
    );

    this.lissajousTime = 0;
    this.lissajousA = nodeTypeDNA.lissajousA;
    this.lissajousB = nodeTypeDNA.lissajousB;
    this.lissajousPhase = nodeTypeDNA.lissajousPhase;

    // this.glowRadius = int(random(2, 6));
    this.glowPhase = random(TWO_PI);

    this.pulseRadius = int(random(0, 35));
    this.maxPulseRadius = int(random(30, 65));
    this.pulseSpeed = map(this.speed, 0.5, 3, 0.5, 1.6);

    this.fleeLockAngle = 0;
    this.fleeActive = false;

    this.isDead = false;
    this.huntTarget = null;
    this.huntPatience = 0;

    // Predate behaviour state machine
    this.predateState = "wander"; // wander, chase, feeding, stunned
    this.feedTarget = null;
    this.eatCooldown = 0;
    this.stunnedTimer = 0;
    this.baseColour = nodeTypeDNA.colour;
    this.escapeRippleRadius = 0;

    // Dying prey state
    this.isDying = false;
    this.dyingTimer = 0;
    this.dyingTimerMax = 150;
    this.dyingAlpha = 255;
  }

  assignColonyGroup(x, y) {
    const mergeDistance = 200;

    for (let groupID in colonyGroups) {
      let colGroup = colonyGroups[groupID];
      let colonyMemberCount = nodes.filter(
        (n) => n.colonyGroupID === int(groupID)
      ).length;

      if (colonyMemberCount >= colonyMaxSize) {
        continue;
      }

      if (dist(x, y, colGroup.anchorX, colGroup.anchorY) < mergeDistance) {
        return int(groupID);
      }
    }

    let newColonyID = colonyGroupCounter;
    colonyGroupCounter++;

    let spawnColonyX = x;
    let spawnColonyY = y;
    const minColonySeparation = 280;

    let attempts = 0;
    let tooClose = true;

    while (tooClose && attempts < 20) {
      tooClose = false;

      for (let groupID in colonyGroups) {
        let existingGroup = colonyGroups[groupID];

        if (
          dist(
            spawnColonyX,
            spawnColonyY,
            existingGroup.anchorX,
            existingGroup.anchorY
          ) < minColonySeparation
        ) {
          tooClose = true;

          let pushAngle = atan2(
            spawnColonyY - existingGroup.anchorY,
            spawnColonyX - existingGroup.anchorX
          );

          spawnColonyX += cos(pushAngle) * 30;
          spawnColonyY += sin(pushAngle) * 30;
          spawnColonyX = constrain(spawnColonyX, envX + 60, envX + envW - 60);
          spawnColonyY = constrain(spawnColonyY, envY + 60, envY + envH - 60);
          break;
        }
      }

      attempts++;
    }

    colonyGroups[newColonyID] = {
      anchorX: spawnColonyX,
      anchorY: spawnColonyY,
      noiseOffsetX: random(10000),
      noiseOffsetY: random(10000),
      colonyRotationSpeed: random(0.0004, 0.0015),
      shapePattern: int(random(5)),
    };

    return newColonyID;
  }

  generateColonyOffset(groupID) {
    let colonyPattern = colonyGroups[groupID]
      ? colonyGroups[groupID].shapePattern
      : 0;

    let colonyAngle = random(TWO_PI);

    if (colonyPattern === 0) {
      return p5.Vector.fromAngle(colonyAngle).mult(random(10, 42));
    } else if (colonyPattern === 1) {
      return p5.Vector.fromAngle(colonyAngle).mult(random(58, 75));
    } else if (colonyPattern === 2) {
      let r = random(20, 70);
      return createVector(cos(colonyAngle) * r, sin(colonyAngle) * r * 0.32);
    } else if (colonyPattern === 3) {
      return p5.Vector.fromAngle(colonyAngle).mult(random(15, 90));
    } else {
      let circleRadius = random(35, 65);
      return p5.Vector.fromAngle(colonyAngle).mult(
        circleRadius + random(-4, 4)
      );
    }
  }

  update(allNodes) {
    // If the user is dragging node, freeze node movement
    if (this.isPinned) {
      return;
    }

    if (this.isDying) {
      this.dyingTimer--;
      this.dyingAlpha = map(this.dyingTimer, 0, this.dyingTimerMax, 0, 255);

      if (this.dyingTimer <= 0) {
        this.isDead = true;
      }
      
      if (
      this.trailStyle !== "none" ||
      this.behaviour === "contrail orb" ||
      this.behaviour === "lissajous"
    ) {
      if (this.posHistory.length >= this.historyLength) {
        // Move oldest point from the front
        let recycledPoint = this.posHistory.shift();
        // Update the point's values
        recycledPoint.pos.set(this.x, this.y);
        recycledPoint.wrapped = false;
        // Move the updated point to the end
        this.posHistory.push(recycledPoint);
      } else {
        // Only create new vectors until the max history length has been reached
        this.posHistory.push({
          pos: createVector(this.x, this.y),
          wrapped: false,
        });
        }
      }
      
      return;
    }
      
//       if (
//         this.trailStyle !== "none" ||
//         this.behaviour === "contrail orb" ||
//         this.behaviour === "lissajous"
//       ) {
//         this.posHistory.push({
//           pos: createVector(this.x, this.y),
//           wrapped: false,
//         });

//         if (this.posHistory.length > this.historyLength) {
//           this.posHistory.shift();
//         }
//       }

//       return;
//     }

    switch (this.behaviour) {
      case "drift wander":
        // Noise wander movement concept inspired by Jared Donovan's Creative Coding Meandering demo
        // https://editor.p5js.org/creativecoding/sketches/m1PcSxkOe

        let driftAngle = map(
          noise(
            this.noiseOffset + frameCount * 0.003,
            this.noiseOffset * 0.5 + frameCount * 0.002
          ),
          0,
          1,
          0,
          TWO_PI
        );

        let driftDesired = p5.Vector.fromAngle(driftAngle).mult(this.speed);
        let driftSteer = p5.Vector.sub(driftDesired, this.growthVector).limit(
          0.05
        );

        this.growthVector.add(driftSteer);
        this.growthVector.setMag(this.speed * 0.5);
        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
      case "orbit":
        // Adapted from Claude Cafe's Colourful Orbits ALgorithm
        // https://claudes.cafe/sketches/colorful-orbits/

        let orbitSumX = 0;
        let orbitSumY = 0;
        let orbitCount = 0;

        for (let other of allNodes) {
          if (other !== this && other.dnaString !== this.dnaString) {
            orbitSumX += other.x;
            orbitSumY += other.y;
            orbitCount++;
          }
        }

        let orbitTargetX = 0;
        let orbitTargetY = 0;

        if (orbitCount > 0) {
          orbitTargetX = orbitSumX / orbitCount;
        } else {
          orbitTargetX = (width + sidebarWidth) / 2;
        }

        if (orbitCount > 0) {
          orbitTargetY = orbitSumY / orbitCount;
        } else {
          orbitTargetY = height / 2;
        }

        this.orbitCentre.x = lerp(this.orbitCentre.x, orbitTargetX, 0.015);
        this.orbitCentre.y = lerp(this.orbitCentre.y, orbitTargetY, 0.015);

        this.orbitCentre.x = constrain(
          this.orbitCentre.x,
          sidebarWidth + this.orbitRadius,
          width - this.orbitRadius
        );
        this.orbitCentre.y = constrain(
          this.orbitCentre.y,
          this.orbitRadius,
          height - this.orbitRadius
        );

        this.orbitAngle += this.speed * 0.015;
        this.x = this.orbitCentre.x + cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.orbitCentre.y + sin(this.orbitAngle) * this.orbitRadius;

        this.growthVector.set(
          -sin(this.orbitAngle) * this.speed,
          cos(this.orbitAngle) * this.speed
        );
        break;

      case "bounce":
        let bounceMagnitude = this.growthVector.mag();

        // Slow down smoothly if moving faster than base speed
        if (bounceMagnitude > this.speed) {
          this.growthVector.mult(0.95);

          if (this.growthVector.mag() < this.speed) {
            this.growthVector.setMag(this.speed);
          }
        } else if (bounceMagnitude < this.speed) {
          // Make sure node doesn't get stuck moving overly slowly
          this.growthVector.setMag(this.speed);
        }

        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;

      case "contrail orb":
        this.growthVector.rotate(random(-0.09, 0.09));

        let contrailMagnitude = this.growthVector.mag();

        // Slow down smoothly if moving faster than base speed
        if (contrailMagnitude > this.speed) {
          this.growthVector.mult(0.95);
          if (this.growthVector.mag() < this.speed) {
            this.growthVector.setMag(this.speed);
          }
        } else {
          this.growthVector.setMag(this.speed);
        }

        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
      case "flock":
        // Adapted from Craig Reynolds' Boids algorithm
        // https://www.red3d.com/cwr/boids/

        let separation = createVector(0, 0);
        let alignment = createVector(0, 0);
        let cohesion = createVector(0, 0);
        let separationCountFlock = 0;
        let alignmentCount = 0;

        //           const separationRadius = 35;
        //           const perceptionRadius = 110;
        //           const maxForce = 0.08;

        //           for (let other of allNodes) {
        //             if (other === this || other.dnaString !== this.dnaString) {
        //               continue;
        //             }

        //             let d = dist(this.x, this.y, other.x, other.y);

        //             if (d > 0 && d < separationRadius) {
        //               let away = p5.Vector.sub(
        //                 createVector(this.x, this.y),
        //                 createVector(other.x, other.y)
        //               );
        //               away.normalize().div(d);
        //               separation.add(away);
        //               separationCountFlock++;
        //             }

        //             if (d < perceptionRadius) {
        //               alignment.add(other.growthVector);
        //               // cohesion.add(createVector(other.x, other.y));
        //               cohesion.x += other.x;
        //               cohesion.y += other.y;
        //               alignmentCount++;
        //             }
        //           }

        const separationRadiusSquare = 35 * 35;
        const perceptionRadiusSquare = 110 * 110;
        const maxForce = 0.08;

        for (let other of allNodes) {
          if (other === this || other.dnaString !== this.dnaString) {
            continue;
          }

          let distanceX = this.x - other.x;
          let distanceY = this.y - other.y;
          let distanceSquare = distanceX * distanceX + distanceY * distanceY;

          if (distanceSquare > 0 && distanceSquare < separationRadiusSquare) {
            let d = sqrt(distanceSquare);
            let away = p5.Vector.sub(
              createVector(this.x, this.y),
              createVector(other.x, other.y)
            );
            away.normalize().div(d);
            separation.add(away);
            separationCountFlock++;
          }

          if (distanceSquare < perceptionRadiusSquare) {
            alignment.add(other.growthVector);
            cohesion.x += other.x;
            cohesion.y += other.y;
            alignmentCount++;
          }
        }

        if (separationCountFlock > 0) {
          separation.div(separationCountFlock).setMag(this.speed);
          separation = p5.Vector.sub(separation, this.growthVector).limit(
            maxForce * 1.6
          );
        }

        if (alignmentCount > 0) {
          alignment.div(alignmentCount).setMag(this.speed);
          alignment = p5.Vector.sub(alignment, this.growthVector).limit(
            maxForce
          );

          cohesion.div(alignmentCount);
          let desiredCohesion = p5.Vector.sub(
            cohesion,
            createVector(this.x, this.y)
          );
          desiredCohesion.setMag(this.speed * 0.03);
          let cohesionSteer = p5.Vector.sub(
            desiredCohesion,
            this.growthVector
          ).limit(maxForce);
          this.growthVector.add(cohesionSteer.mult(0.5));
        } else {
          let centreX = envX + envW / 2;
          let centreY = envY + envH / 2;
          let toCentre = createVector(centreX - this.x, centreY - this.y);
          toCentre.setMag(this.speed);
          let centreSteer = p5.Vector.sub(toCentre, this.growthVector).limit(
            maxForce * 0.4
          );
          this.growthVector.add(centreSteer);
        }

        // Apply steering forces
        this.growthVector.add(separation.mult(0.9));
        this.growthVector.add(alignment.mult(0.6));
        this.growthVector.limit(this.speed);

        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
      case "scatter":
        // Adapted from the flock behaviour and inspired by Daniel Shiffman's separation explanation from Nature of Code
        // https://natureofcode.com/autonomous-agents/

        let separationSteer = createVector(0, 0);
        let separationCount = 0;
        let closestThreat = null;
        let closestDSquare = Infinity;
        let highestApproachWeight = 0;

        let innerSeparation = this.size * this.separationMultiplier;
        let outerSeparation = innerSeparation * 1.6; // 1.4, 2
        let outerSeparationSquare = outerSeparation * outerSeparation;
        let separationMaxForce = 0.16; // 0.15, 0.16, 0.18, 0.22, 0.28, 0.35, 0.4

        for (let other of allNodes) {
          if (other === this) {
            continue;
          }

          let dx = this.x - other.x;
          let dy = this.y - other.y;
          let detectionSquare = dx * dx + dy * dy;

          if (detectionSquare > 0 && detectionSquare < outerSeparationSquare) {
            let d = sqrt(detectionSquare);

            let distStrength;
            if (d >= innerSeparation) {
              distStrength = map(d, outerSeparation, innerSeparation, 0, 0.35); // 0.35
            } else {
              distStrength = map(d, innerSeparation, 0, 0.35, 1);
            }

            let awayNodeX = dx / d;
            let awayNodeY = dy / d;

            let approachDot =
              other.growthVector.x * awayNodeX +
              other.growthVector.y * awayNodeY;

            let approachFactor = max(
              0.25,
              map(approachDot, -other.speed, other.speed, 0, 1.8)
            );
            let pushStrength = distStrength * approachFactor;

            let away = createVector(dx, dy);
            away.normalize().mult(pushStrength);
            separationSteer.add(away);
            separationCount++;

            let threatWeight = distStrength * approachFactor;
            if (threatWeight > highestApproachWeight) {
              highestApproachWeight = threatWeight;
              closestDSquare = detectionSquare;
              closestThreat = createVector(dx, dy);
            }
          }
        }

        // Boundary Handling
        let boundaryMargin = innerSeparation * 1.8;
        let boundaryForce = createVector(0, 0);
        let boundaryStrength = 1.2;
        let distanceLeft = this.x - envX;
        let distanceRight = envX + envW - this.x;
        let distanceTop = this.y - envY;
        let distanceBottom = envY + envH - this.y;

        if (distanceLeft < boundaryMargin) {
          boundaryForce.x += map(
            distanceLeft,
            0,
            boundaryMargin,
            boundaryStrength,
            0
          );
        }

        if (distanceRight < boundaryMargin) {
          boundaryForce.x -= map(
            distanceRight,
            0,
            boundaryMargin,
            boundaryStrength,
            0
          );
        }

        if (distanceTop < boundaryMargin) {
          boundaryForce.y += map(
            distanceTop,
            0,
            boundaryMargin,
            boundaryStrength,
            0
          );
        }

        if (distanceBottom < boundaryMargin) {
          boundaryForce.y -= map(
            distanceBottom,
            0,
            boundaryMargin,
            boundaryStrength,
            0
          );
        }

        if (separationCount > 0 && closestThreat !== null) {
          separationSteer.div(separationCount);
          separationSteer.normalize();
          closestThreat.normalize();

          let closestD = sqrt(closestDSquare);
          let fleeUrgency = map(closestD, outerSeparation, 0, 0, 1, true);
          fleeUrgency = constrain(
            fleeUrgency * map(highestApproachWeight, 0, 1.5, 0.3, 1),
            0,
            1
          );

          if (fleeUrgency > 0.12) {
            this.fleeActive = true;

            let rawFleeDirection = p5.Vector.add(
              p5.Vector.mult(separationSteer, 0.3),
              p5.Vector.mult(closestThreat, 0.7)
            );

            let rawAngle = rawFleeDirection.heading();
            let angleDifference = rawAngle - this.fleeLockAngle;

            while (angleDifference > PI) {
              angleDifference -= TWO_PI;
            }

            while (angleDifference < -PI) {
              angleDifference += TWO_PI;
            }

            let maxTurnRate = map(fleeUrgency, 0.12, 1.0, 0.04, 0.12);
            this.fleeLockAngle += constrain(
              angleDifference,
              -maxTurnRate,
              maxTurnRate
            );

            let fleeSpeed = map(
              fleeUrgency,
              0,
              1,
              this.speed * 0.6,
              this.speed * 2.8
            );

            let fleeDirection = p5.Vector.fromAngle(this.fleeLockAngle).mult(
              fleeSpeed
            );

            let blendWeight = map(fleeUrgency, 0.12, 1.0, 0.15, 0.95);
            let blendedTarget = p5.Vector.add(
              p5.Vector.mult(fleeDirection, blendWeight),
              p5.Vector.mult(this.growthVector, 1.0 - blendWeight)
            );

            let steerForce = p5.Vector.sub(
              blendedTarget,
              this.growthVector
            ).limit(separationMaxForce);

            let fleeWobble = map(
              noise(this.noiseOffset + 4000, frameCount * 0.004),
              0,
              1,
              -0.06,
              0.06
            );
            steerForce.rotate(fleeWobble);

            this.growthVector.add(steerForce);
          } else {
            this.fleeActive = false;
          }
          this.growthVector.add(boundaryForce.mult(0.06));

          let dampingFactor = map(fleeUrgency, 0, 1, 0.995, 0.97);
          this.growthVector.mult(dampingFactor);
        } else {
          this.fleeActive = false;
          this.growthVector.mult(0.92); // 0.92
          this.growthVector.add(boundaryForce.mult(0.04)); // 0.04

          // Spontaneous hop
          let restlessTrigger = noise(
            this.noiseOffset + 2000,
            frameCount * 0.003
          );

          if (restlessTrigger > 0.86) {
            let burstAngle =
              noise(this.noiseOffset + 3000, frameCount * 0.003) * TWO_PI * 6;
            let burstMagnitude =
              this.speed * map(restlessTrigger, 0.86, 1.0, 0.5, 1.6);
            this.growthVector.x += cos(burstAngle) * burstMagnitude;
            this.growthVector.y += sin(burstAngle) * burstMagnitude;
            this.fleeLockAngle = this.growthVector.heading();
          }

          let idleJiggleX = map(
            noise(this.noiseOffset, frameCount * 0.004),
            0,
            1,
            -0.07, // 0.08
            0.07 // 0.08
          );
          let idleJiggleY = map(
            noise(this.noiseOffset + 1000, frameCount * 0.004),
            0,
            1,
            -0.07, // 0.08
            0.07 // 0.08
          );
          this.growthVector.add(createVector(idleJiggleX, idleJiggleY));
        }

        this.growthVector.limit(this.speed * 2.8); // 2.5, 3
        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
      case "lissajous":
        // Adapted from Claude Cafe's Lissajous Curves Algorithm
        // https://claudes.cafe/sketches/lissajous-curves/

        this.lissajousTime += this.speed * 0.004;

        this.x =
          this.orbitCentre.x +
          this.orbitRadius *
            sin(this.lissajousA * this.lissajousTime + this.lissajousPhase);
        this.y =
          this.orbitCentre.y +
          this.orbitRadius * sin(this.lissajousB * this.lissajousTime);
        break;
      case "colony":
        // Adapted from the p5.js Soft Body Maths & Physics example
        // https://p5js.org/examples/math-and-physics-soft-body/

        if (!colonyGroups[this.colonyGroupID]) {
          break;
        }

        let colGroup = colonyGroups[this.colonyGroupID];

        let colonyRotationAngle = frameCount * colGroup.colonyRotationSpeed;

        // Rotate each node's fixed offset around the colony anchor
        let colonyOffsetX =
          this.colonyAnchorOffset.x * cos(colonyRotationAngle) -
          this.colonyAnchorOffset.y * sin(colonyRotationAngle);
        let colonyOffsetY =
          this.colonyAnchorOffset.x * sin(colonyRotationAngle) +
          this.colonyAnchorOffset.y * cos(colonyRotationAngle);

        // Target = drifting anchor + rotated personal offset
        let colonyTargetX = colGroup.anchorX + colonyOffsetX;
        let colonyTargetY = colGroup.anchorY + colonyOffsetY;

        // Small bobs for each node using Perlin noise
        let bobX = map(
          noise(this.noiseOffset, frameCount * 0.008),
          0,
          1,
          -3.5,
          3.5
        );

        let bobY = map(
          noise(this.noiseOffset + 500, frameCount * 0.008),
          0,
          1,
          -3.5,
          3.5
        );

        this.x = lerp(this.x, colonyTargetX + bobX, 0.06);
        this.y = lerp(this.y, colonyTargetY + bobY, 0.06);

        this.growthVector.set(colonyOffsetX * 0.005, colonyOffsetY * 0.005);
        break;
      case "pulse ripple":
        // Adapted from Claude Cafe's Ripple Effect Algorithm
        // https://claudes.cafe/sketches/ripple-effect/

        this.growthVector.rotate(random(-0.06, 0.06));
        this.growthVector.setMag(this.speed * 0.2);
        this.x += this.growthVector.x;
        this.y += this.growthVector.y;

        this.pulseRadius += this.pulseSpeed;
        if (this.pulseRadius > this.maxPulseRadius) {
          this.pulseRadius = 0;
        }
        break;
      case "growth":
        // Adapted from Jared Donovan's Creative Coding Grow Demo
        // https://editor.p5js.org/creativecoding/sketches/1yVKKYiAX

        let gt = frameCount * 0.003;
        let nOffsetX = this.noiseOffset * 0.07;
        let nOffsetY = this.noiseOffset * 0.07 + 500;

        // Dynamic margins for preview canvas and main environment
        let marginX = min(40, envW * 0.15);
        let marginY = min(40, envH * 0.15);

        this.growthTarget.x = map(
          noise(nOffsetX, gt),
          0.3, // 0.2
          0.7, // 0.8
          envX + marginX,
          envX + envW - marginX
        );
        this.growthTarget.y = map(
          noise(nOffsetY, gt),
          0.3, // 0.2
          0.7, // 0.8
          envY + marginY,
          envY + envH - marginY
        );

        //         let growthRepulsion = createVector(0, 0);
        //         for (let other of allNodes) {
        //           if (other === this || other.dnaString !== this.dnaString) {
        //             continue;
        //           }

        //           let repelDistance = dist(this.x, this.y, other.x, other.y);
        //           if (repelDistance > 0 && repelDistance < 250) {
        //             // 120
        //             let repelDirection = createVector(
        //               this.x - other.x,
        //               this.y - other.y
        //             );
        //             repelDirection.normalize().div(repelDistance); // Stronger repel based on node proximity
        //             growthRepulsion.add(repelDirection);
        //           }
        //         }

        let growthRepulsion = createVector(0, 0);
        let repelThresholdSquare = 250 * 250; // 62500

        for (let other of allNodes) {
          if (other === this || other.dnaString !== this.dnaString) {
            continue;
          }

          let dx = this.x - other.x;
          let dy = this.y - other.y;
          let repelDistanceSquare = dx * dx + dy * dy;

          if (
            repelDistanceSquare > 0 &&
            repelDistanceSquare < repelThresholdSquare
          ) {
            let repelDistance = sqrt(repelDistanceSquare);
            let repelDirection = createVector(dx, dy);
            repelDirection.normalize().div(repelDistance);
            growthRepulsion.add(repelDirection);
          }
        }

        let toTarget = p5.Vector.sub(
          this.growthTarget,
          createVector(this.x, this.y)
        );

        let toTargetDist = toTarget.mag();
        let slowRadius = min(80, envW * 0.25); // Scale slowing radius for tiny boxes

        if (toTargetDist > 1) {
          let arrivalSpeed =
            toTargetDist < slowRadius
              ? map(toTargetDist, 0, slowRadius, this.speed * 0.2, this.speed) // Prevent speed lower than 20% of base
              : this.speed;

          toTarget.setMag(arrivalSpeed);

          let growthSteer = p5.Vector.sub(toTarget, this.growthVector).limit(
            0.12
          );
          this.growthVector.add(growthSteer);
        }

        this.growthVector.add(growthRepulsion.mult(0.35)); // 0.18
        this.growthVector.limit(this.speed);
        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
      case "weave":
        let weaveAngle = map(
          noise(this.noiseOffset + frameCount * 0.003),
          0,
          1,
          0,
          TWO_PI
        );

        let desiredWeave = p5.Vector.fromAngle(weaveAngle).mult(
          this.speed * 0.7
        );
        let steerWeave = p5.Vector.sub(desiredWeave, this.growthVector).limit(
          0.04
        );
        
        this.growthVector.add(steerWeave);
        this.growthVector.setMag(this.speed * 0.7);
        this.x += this.growthVector.x;
        this.y += this.growthVector.y;

        this.weaveDropCounter++;
        if (this.weaveDropCounter >= this.weaveDropInterval) {
          this.weaveDropCounter = 0;
          this.weaveHistory.push({
            x: this.x,
            y: this.y,
            age: 0,
            wrapped: this.weaveJustWrapped,
          });
          this.weaveJustWrapped = false;
          if (this.weaveHistory.length > this.weaveMaxHistory) {
            this.weaveHistory.shift(); // drop oldest segment
          }
        }

        for (let weavePoint of this.weaveHistory) {
          weavePoint.age++;
        }
        break;
      case "predate":
        // Expanding escape ripple
        if (this.escapeRippleRadius > 0) {
          this.escapeRippleRadius += 5; // Ripple expansion speed

          // Reset once max size is reached
          if (this.escapeRippleRadius > 50) {
            // 80, 100
            this.escapeRippleRadius = 0;
          }
        }

        // Stunned state
        if (this.predateState === "stunned") {
          this.stunnedTimer--;

          if (this.stunnedTimer <= 0) {
            this.colour = this.baseColour; // restore original colour
            this.predateState = "wander";
          }

          break;
        }

        // Feeding state (waiting for successfull consumption or escape)
        if (this.predateState === "feeding") {
          // Validate feed target
          if (
            this.feedTarget === null ||
            this.feedTarget.isDead ||
            !this.feedTarget.isDying
          ) {
            this.feedTarget = null;
            this.eatCooldown = int(random(180, 300)); // 3-5 second cooldown
            this.predateState = "wander";
            break;
          }

          // Stay stuck near capture position
          this.x = lerp(this.x, this.feedTarget.x, 0.12);
          this.y = lerp(this.y, this.feedTarget.y, 0.12);
          this.growthVector.set(0, 0);

          // Small chance each frame that prey breaks free
          if (random(1) < 0.009) {
            // 0.005, 0.006, 0.009
            // Escape logic

            // Burst angle
            let escapeDirectionX = this.feedTarget.x - this.x;
            let escapeDirectionY = this.feedTarget.y - this.y;
            let escapeLength = sqrt(
              escapeDirectionX * escapeDirectionX +
                escapeDirectionY * escapeDirectionY
            );

            if (escapeLength < 0.01) {
              // Pick a random direction if overlapping
              escapeDirectionX = cos(random(TWO_PI));
              escapeDirectionY = sin(random(TWO_PI));
            } else {
              escapeDirectionX /= escapeLength;
              escapeDirectionY /= escapeLength;
            }

            // Restore & free prey node
            this.feedTarget.isDying = false;
            this.feedTarget.dyingTimer = 0;
            this.feedTarget.dyingAlpha = 255;
            this.feedTarget.colour = this.feedTarget.baseColour;
            this.feedTarget.growthVector.set(
              escapeDirectionX * this.feedTarget.speed * 5,
              escapeDirectionY * this.feedTarget.speed * 5
            );

            // Stun offending predator
            let stunnedColour = lerpColor(
              color(this.baseColour),
              color(170, 170, 170),
              0.72
            );

            this.colour = `rgb(${floor(red(stunnedColour))}, ${floor(
              green(stunnedColour)
            )}, ${floor(blue(stunnedColour))})`;

            this.predateState = "stunned";
            this.stunnedTimer = int(random(180, 300)); // 3-5 second stun
            this.escapeRippleRadius = 1; // Begin escape ripple
            this.growthVector.set(0, 0);
            this.feedTarget = null;
          }

          break;
        }

        // Wander & Chase States

        // Tick eat cooldown
        if (this.eatCooldown > 0) {
          this.eatCooldown--;
        }

        // Invalidate target if already eaten or removed by user
        if (this.huntTarget !== null) {
          if (
            this.huntTarget.isDead ||
            this.huntTarget.isDying ||
            !allNodes.includes(this.huntTarget)
          ) {
            this.huntTarget = null;
            this.predateState = "wander";
          }
        }

        // Give up and wander again if patience counter runs out
        if (this.predateState === "chase") {
          this.huntPatience--;
          if (this.huntPatience <= 0) {
            this.huntTarget = null;
            this.predateState = "wander";
          }
        }

        if (this.predateState === "chase" && this.huntTarget !== null) {
          // Chase state
          let toTargetX = this.huntTarget.x - this.x;
          let toTargetY = this.huntTarget.y - this.y;
          let distanceToTargetSquare =
            toTargetX * toTargetX + toTargetY * toTargetY;
          let catchRange = (this.size + this.huntTarget.size) / 2 + 5;

          if (distanceToTargetSquare < catchRange * catchRange) {
            // Begin feeding state if prey node within radius
            this.huntTarget.isDying = true;
            this.huntTarget.dyingTimer = this.huntTarget.dyingTimerMax;
            this.huntTarget.dyingAlpha = 255;
            this.huntTarget.colour = this.colour; // prey takes on predator's colour
            this.huntTarget.growthVector.set(0, 0);
            this.feedTarget = this.huntTarget;
            this.huntTarget = null;
            this.predateState = "feeding";
          } else {
            // Increased speed while chasing
            let toTarget = createVector(toTargetX, toTargetY);
            toTarget.setMag(this.speed * 1.5);
            let chaseSteer = p5.Vector.sub(toTarget, this.growthVector).limit(
              0.12
            );
            this.growthVector.add(chaseSteer);
            this.growthVector.limit(this.speed * 1.5);
          }
        } else {
          // Wander state
          this.predateState = "wander";

          // Territory radius scan for other node types
          if (this.eatCooldown <= 0 && frameCount % 4 === 0) {
            let personalSpaceSquare = 75 * 75; // Personal space lol

            for (let other of allNodes) {
              if (
                other === this ||
                other.isDead ||
                other.isDying ||
                other.dnaString === this.dnaString
              ) {
                continue;
              }
              let spaceDistanceX = this.x - other.x;
              let spaceDistanceY = this.y - other.y;

              if (
                spaceDistanceX * spaceDistanceX +
                  spaceDistanceY * spaceDistanceY <
                personalSpaceSquare
              ) {
                // Predator only has a chance to attack even when another node type is in range
                if (random(1) < 0.12) {
                  this.huntTarget = other;
                  this.huntPatience = int(random(120, 240)); // 2-4 second duration
                  this.predateState = "chase";
                  break;
                }
              }
            }
          }

          // Noise wander
          let predateWanderAngle = map(
            noise(
              this.noiseOffset + frameCount * 0.003,
              this.noiseOffset * 0.5 + frameCount * 0.002
            ),
            0,
            1,
            0,
            TWO_PI
          );

          let predateWanderDesired = p5.Vector.fromAngle(
            predateWanderAngle
          ).mult(this.speed * 0.6);

          let predateWanderSteer = p5.Vector.sub(
            predateWanderDesired,
            this.growthVector
          ).limit(0.04);

          this.growthVector.add(predateWanderSteer);
          this.growthVector.setMag(this.speed * 0.6);
        }

        this.x += this.growthVector.x;
        this.y += this.growthVector.y;
        break;
    }

    if (this.behaviour !== "orbit" && this.behaviour !== "lissajous") {
      if (this.behaviour === "colony") {
        if (colonyGroups[this.colonyGroupID]) {
          this.rotation =
            frameCount * colonyGroups[this.colonyGroupID].colonyRotationSpeed;
        }
      } else if (this.growthVector.mag() > 0.1) {
        let targetAngle = atan2(this.growthVector.y, this.growthVector.x);

        if (this.behaviour === "growth") {
          let angleDifference = targetAngle - this.rotation;

          while (angleDifference > PI) {
            angleDifference -= TWO_PI;
          }

          while (angleDifference < -PI) {
            angleDifference += TWO_PI;
          }

          this.rotation += angleDifference * 0.03;
        } else {
          this.rotation = targetAngle;
        }
      }
    } else {
      this.rotation += this.speed * 0.025;
    }

    this.handleBoundaries();

    if (
      this.trailStyle !== "none" ||
      this.behaviour === "contrail orb" ||
      this.behaviour === "lissajous"
    ) {
      // this.posHistory.push(createVector(this.x, this.y));
      this.posHistory.push({
        pos: createVector(this.x, this.y),
        wrapped: false, // normal point so no wrap
      });

      if (this.posHistory.length > this.historyLength) {
        this.posHistory.shift();
      }
    }

    // Node-On-Node Collision Logic
    //     for (let other of allNodes) {
    //       if (other === this) {
    //         continue;
    //       }

    //       let dx = this.x - other.x;
    //       let dy = this.y - other.y;

    //       // Calculate minimum allowed distance
    //       let minDistance = (this.size + other.size) / 2;
    //       let dSq = dx * dx + dy * dy;

    //       // If nodes spawn exactly on top of each other, give them a small nudge
    //       if (dSq === 0) {
    //         dx = random(-0.1, 0.1);
    //         dy = random(-0.1, 0.1);
    //         dSq = dx * dx + dy * dy;
    //       }

    //       // See if nodes are touching
    //       if (dSq < minDistance * minDistance) {
    //         let d = sqrt(dSq);

    //         // How much are they intersecting
    //         let overlap = minDistance - d;

    //         // Normalize the push direction
    //         let nx = dx / d;
    //         let ny = dy / d;

    //         // Push node away by half the overlap distance positionally
    //         this.x += nx * overlap * 0.5;
    //         this.y += ny * overlap * 0.5;

    //         let isFixedPath =
    //           this.behaviour === "orbit" ||
    //           this.behaviour === "lissajous" ||
    //           this.behaviour === "colony";

    //         if (!isFixedPath) {
    //           let bounceForce = 0.35;
    //           this.growthVector.x += nx * bounceForce;
    //           this.growthVector.y += ny * bounceForce;
    //         }
    //       }
    //     }

    let isFixedPathNode =
      // this.behaviour === "orbit" ||
      this.behaviour === "lissajous" ||
      this.behaviour === "colony" ||
      this.behaviour === "weave";

    if (!isFixedPathNode) {
      for (let other of allNodes) {
        if (other === this || other.isDead || other.isDying) {
          continue;
        }

        let dx = this.x - other.x;
        let dy = this.y - other.y;
        let minDistance = (this.size + other.size) / 2;
        let dSquare = dx * dx + dy * dy;

        if (dSquare === 0) {
          dx = random(-0.1, 0.1);
          dy = random(-0.1, 0.1);
          dSquare = dx * dx + dy * dy;
        }

        if (dSquare < minDistance * minDistance) {
          let d = sqrt(dSquare);
          let overlap = minDistance - d;
          let nx = dx / d;
          let ny = dy / d;

          this.x += nx * overlap * 0.5;
          this.y += ny * overlap * 0.5;

          if (this.behaviour === "orbit") {
            this.orbitCentre.x += nx * 0.25;
            this.orbitCentre.y += ny * 0.25;
          } else {
            let bounceForce = 0.35;
            this.growthVector.x += nx * bounceForce;
            this.growthVector.y += ny * bounceForce;
          }
          }
        }
      }

      this.handleBoundaries();
    }

  handleBoundaries() {
    let nodeRadius = this.size / 2;

    if (this.behaviour === "orbit" || this.behaviour === "lissajous") {
      let safeR = min(this.orbitRadius, envW * 0.44, envH * 0.44);
      this.orbitCentre.x = constrain(
        this.orbitCentre.x,
        envX + safeR + 4,
        envX + envW - safeR - 4
      );

      this.orbitCentre.y = constrain(
        this.orbitCentre.y,
        envY + safeR + 4,
        envY + envH - safeR - 4
      );
      return;
    }

    if (this.behaviour === "colony") {
      return;
    }

    if (this.behaviour === "bounce" || this.behaviour === "contrail orb") {
      let left = envX + nodeRadius;
      let right = envX + envW - nodeRadius;
      let top = envY + nodeRadius;
      let bottom = envY + envH - nodeRadius;

      if (this.x < left) {
        this.growthVector.x = abs(this.growthVector.x);
        this.x = left;
      }

      if (this.x > right) {
        this.growthVector.x = -abs(this.growthVector.x);
        this.x = right;
      }

      if (this.y < top) {
        this.growthVector.y = abs(this.growthVector.y);
        this.y = top;
      }

      if (this.y > bottom) {
        this.growthVector.y = -abs(this.growthVector.y);
        this.y = bottom;
      }
    } else {
      let didWrap = false;

      // Check X bounds (Left & Right)
      if (this.x < envX - nodeRadius) {
        this.x = envX + envW + nodeRadius;
        didWrap = true;
      } else if (this.x > envX + envW + nodeRadius) {
        this.x = envX - nodeRadius;
        didWrap = true;
      }

      // Check Y bounds (Top & Bottom)
      if (this.y < envY - nodeRadius) {
        this.y = envY + envH + nodeRadius;
        didWrap = true;
      } else if (this.y > envY + envH + nodeRadius) {
        this.y = envY - nodeRadius;
        didWrap = true;
      }

      if (didWrap) {
        // this.posHistory = [];
        this.posHistory.push({
          pos: createVector(this.x, this.y),
          wrapped: true,
        });
        this.weaveJustWrapped = true;
      }
    }
  }

  drawGlow(c) {
    noStroke();
    let r = red(c);
    let g = green(c);
    let b = blue(c);

    switch (this.glowStyle) {
      case "steady":
        drawingContext.shadowBlur = this.size * 2.5;
        drawingContext.shadowColor = `rgba(${r}, ${g}, ${b}, 0.85)`;
        fill(c);
        noStroke();
        this.drawShape(this.x, this.y, this.size, this.rotation);
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = "rgba(0,0,0,0)";

        break;
      case "pulse":
        let pulseAmount = abs(sin(frameCount * 0.06 + this.glowPhase));
        drawingContext.shadowBlur = this.size * 3 * pulseAmount;
        drawingContext.shadowColor = `rgba(${r}, ${g}, ${b}, 0.9)`;
        fill(c);
        noStroke();
        this.drawShape(this.x, this.y, this.size, this.rotation);
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = "rgba(0,0,0,0)";
        break;
    }
  }

  drawTrail(c, selectedTrailStyle, alphaMultiplier = 1) {
    switch (selectedTrailStyle) {
      case "curve fill":
        if (this.posHistory.length >= 4) {
          let pulse = 0.6 + 0.4 * abs(sin(frameCount * 0.02 + this.glowPhase));
          fill(red(c), green(c), blue(c), 90 * pulse * alphaMultiplier);
          stroke(red(c), green(c), blue(c), 90 * pulse * alphaMultiplier);
          strokeWeight(pulse);
          beginShape();

          for (let point of this.posHistory) {
            if (point.wrapped) {
              endShape();
              beginShape();
              continue;
            }
            curveVertex(point.pos.x, point.pos.y);
          }
          endShape();
        }
        break;
      case "fade":
        noFill();

        for (let i = 1; i < this.posHistory.length; i++) {
          if (this.posHistory[i].wrapped) {
            continue;
          }

          let trailOpacity =
            map(i, 0, this.posHistory.length, 0, 190) * alphaMultiplier;
          let trailWeight = map(i, 0, this.posHistory.length, 0.4, 2.2);

          stroke(red(c), green(c), blue(c), trailOpacity);
          strokeWeight(trailWeight);
          line(
            this.posHistory[i - 1].pos.x,
            this.posHistory[i - 1].pos.y,
            this.posHistory[i].pos.x,
            this.posHistory[i].pos.y
          );
        }
        break;
      case "dots":
        noStroke();
        for (let i = 0; i < this.posHistory.length; i++) {
          let trailOpacity =
            map(i, 0, this.posHistory.length, 0, 170) * alphaMultiplier;
          let trailDotSize = map(
            i,
            0,
            this.posHistory.length,
            1,
            this.size * 0.55
          );

          fill(red(c), green(c), blue(c), trailOpacity);
          circle(
            this.posHistory[i].pos.x,
            this.posHistory[i].pos.y,
            trailDotSize
          );
        }
        break;
      case "curve":
        noFill();
        stroke(red(c), green(c), blue(c), 150 * alphaMultiplier);
        strokeWeight(1.5);

        if (this.posHistory.length >= 4) {
          beginShape();
          for (let point of this.posHistory) {
            if (point.wrapped) {
              endShape();
              beginShape();
              continue;
            }
            curveVertex(point.pos.x, point.pos.y);
          }
          endShape();
        }
        break;
      case "ribbon":
        noFill();

        for (let i = 1; i < this.posHistory.length; i++) {
          if (this.posHistory[i].wrapped) {
            continue;
          }

          let trailOpacity =
            map(i, 0, this.posHistory.length, 0, 160) * alphaMultiplier;
          let trailWeight = map(
            i,
            0,
            this.posHistory.length,
            0.3,
            this.size * 0.75
          );

          stroke(red(c), green(c), blue(c), trailOpacity);
          strokeWeight(trailWeight);
          line(
            this.posHistory[i - 1].pos.x,
            this.posHistory[i - 1].pos.y,
            this.posHistory[i].pos.x,
            this.posHistory[i].pos.y
          );
        }
        break;
    }
  }

  drawShape(x, y, s, angle) {
    push();
    translate(x, y);
    rotate(angle);
    let radius = s / 2;

    switch (this.shape) {
      case "circle":
        circle(0, 0, s);
        break;
      case "triangle":
        // Equilateral triangle
        triangle(
          0,
          -radius,
          radius * 0.866,
          radius * 0.5,
          -radius * 0.866,
          radius * 0.5
        );
        break;
      case "square":
        rectMode(CENTER);
        rect(0, 0, s * 0.88, s * 0.88, 2);
        break;
      case "ellipse":
        ellipse(0, 0, s * 1.65, s * 0.62);
        break;
      case "hexagon":
        this.drawPolygon(0, 0, radius, 6);
        break;
      default:
        circle(0, 0, s);
    }
    pop();
  }

  drawPolygon(x, y, r, npoints) {
    beginShape();
    for (let i = 0; i < npoints; i++) {
      let a = (TWO_PI * i) / npoints - HALF_PI;
      vertex(x + cos(a) * r, y + sin(a) * r);
    }
    endShape(CLOSE);
  }

  display() {
    push();
    let c = color(this.colour);
    let cRed = red(c);
    let cGreen = green(c);
    let cBlue = blue(c);
    let cAccent = this.isDying ? this.dyingAlpha : 255;

    if (this.behaviour === "pulse ripple" && this.pulseRadius > 0) {
      let pulseRingOpacity = map(this.pulseRadius, 0, this.maxPulseRadius, 220, 0);
      noFill();
      stroke(cRed, cGreen, cBlue, pulseRingOpacity);
      strokeWeight(1.8);
      ellipse(this.x, this.y, this.pulseRadius * 2, this.pulseRadius * 2);
    }

    // Escape ripple
    if (this.escapeRippleRadius > 0) {
      let rippleAlpha = map(this.escapeRippleRadius, 1, 100, 200, 0);
      noFill();
      stroke(cRed, cGreen, cBlue, rippleAlpha);
      strokeWeight(2.5);
      ellipse(this.x, this.y, this.escapeRippleRadius * 2, this.escapeRippleRadius * 2);
      noStroke();
    }

    noStroke();

    if (this.behaviour === "weave" && this.weaveHistory.length >= 2) {
      for (let i = 1; i < this.weaveHistory.length; i++) {
        let weavePoint = this.weaveHistory[i];
        let weavePreviousPoint = this.weaveHistory[i - 1];

        if (weavePoint.wrapped) {
          continue;
        }

        let ageFade = constrain(map(weavePoint.age, 0, this.weaveMaxAge, 1, 0), 0, 1);
        let weavePulse = 0.45 + 0.55 * abs(sin(frameCount * 0.04 + this.weavePulsePhase));
        let segmentOpacity = 160 * ageFade * weavePulse;
        let segmentWeight = map(weavePoint.age, 0, this.weaveMaxAge, 2.5, 0.5);

        // Glow - Thicker and very transparent
        stroke(cRed, cGreen, cBlue, segmentOpacity * 0.2);
        strokeWeight(segmentWeight * 3);
        line(weavePreviousPoint.x, weavePreviousPoint.y, weavePoint.x, weavePoint.y);

        // Draw core line - thinner and more opaque
        stroke(cRed, cGreen, cBlue, segmentOpacity);
        strokeWeight(segmentWeight);
        line(weavePreviousPoint.x, weavePreviousPoint.y, weavePoint.x, weavePoint.y);
      }
      noStroke();
    }

    let activeTrail = this.trailStyle;
    if (this.behaviour === "contrail orb") {
      activeTrail = "curve fill";
    }

    if (activeTrail !== "none" && this.posHistory.length >= 2) {
      this.drawTrail(c, activeTrail, cAccent / 255.0); 
    }

    if (this.glowStyle !== "none") {
      this.drawGlow(c); 
    } else {
      fill(cRed, cGreen, cBlue, cAccent);
      noStroke();
      this.drawShape(this.x, this.y, this.size, this.rotation);
    }
    pop();
  }
}
