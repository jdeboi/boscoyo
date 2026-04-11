class MossBush {
  constructor(x, y, numChains, szFactor, pg) {
    this.mossChains = [];
    this.szFactor = szFactor;
    this.pg = pg;
    for (let i = 0; i < numChains; i++) {
      const dx = i * 3 * szFactor;
      const dy = random(-5, 5) * szFactor;
      const minLen = 100 * szFactor;
      const maxLen = 400 * szFactor;
      let len = map(i, 0, numChains / 2, minLen, maxLen);
      if (i > numChains / 2) {
        len = map(i, numChains / 2, numChains, maxLen, minLen);
      }
      len += random(-10, 10) * szFactor;
      this.mossChains.push(new MossChain(x + dx, y + dy, len, szFactor, pg));
    }
  }

  display() {
    this.mossChains.forEach((mossChain) => {
      mossChain.display();
    });
  }

  update(growthRate) {
    this.mossChains.forEach((mossChain) => {
      // remove current mossChain from this.mossChains
      const otherChains = this.mossChains.filter(
        (chain) => chain !== mossChain,
      );
      mossChain.update(otherChains);
      mossChain.grow(growthRate);
    });
  }

  handleMouseDragged() {
    this.mossChains.forEach((mossChain) => {
      mossChain.handleMouseDragged();
    });
  }

  handleMousePressed() {
    this.mossChains.forEach((mossChain) => {
      mossChain.handleMousePressed();
    });
  }

  handleMouseReleased() {
    this.mossChains.forEach((mossChain) => {
      mossChain.handleMouseReleased();
    });
  }

  applyRepulsion(rx, ry, radius, strength) {
    this.mossChains.forEach((mossChain) => {
      mossChain.applyRepulsion(rx, ry, radius, strength);
    });
  }
}

class MossChain {
  constructor(x, y, terminalLength, szFactor, pg) {
    this.nodes = [];
    this.pg = pg;
    this.szFactor = szFactor;
    this.constraints = [];
    this.draggingNode = null;
    this.col = this.getColor();

    this.nodeSpacing = random(10, 30) * szFactor;
    this.noiseOffset = random(0, 1000);
    this.growthLength = 0; // Tracks the total growth length
    this.terminalLength = terminalLength * szFactor;
    this.isGrowing = true;
    // Add the first node
    this.nodes.push({
      x: x,
      y: y,
      prevX: x,
      prevY: y,
      isFixed: true, // First node is fixed
      leaves: this.createLeaves(), // No leaves on the root node
    });

    // this.tip = {
    //   x: x,
    //   y: y,
    //   leaves: this.createLeaves(), // Tip has its own leaves
    // };
    this.createNode();
  }

  getColor() {
    const colors = [this.pg.color(127, 141, 127), this.pg.color(255)];
    const col = this.pg.lerpColor(colors[0], colors[1], this.pg.random(0, 1));
    return this.pg.color(
      this.pg.red(col),
      this.pg.green(col),
      this.pg.blue(col),
      255,
    );
  }

  // Generate random leaves
  createLeaves() {
    const leafCount = int(this.pg.random(1, 4), this.pg); // 1 to 3 leaves
    let leaves = [];
    for (let i = 0; i < leafCount; i++) {
      leaves.push(new Leaf(i, this.szFactor, this.pg));
    }
    return leaves;
  }

  // Grow the moss
  grow(growthRate) {
    if (!this.isGrowing) {
      return; // Moss has reached its terminal length
    }
    if (this.growthLength >= this.terminalLength) {
      this.isGrowing = false;
      return;
    }
    if (this.draggingNode) {
      return;
    }

    this.growthLength += growthRate;

    // Get the last node and calculate the tip's target position
    const lastNode = this.nodes[this.nodes.length - 2];
    const tipNode = this.nodes[this.nodes.length - 1];
    // let targetX = lastNode.x;
    // let targetY = lastNode.y + this.nodeSpacing;

    // // Interpolate the tip position toward the target
    // let dx = targetX - tipNode.x;
    // let dy = targetY - tipNode.y;
    // let distance = sqrt(dx * dx + dy * dy);

    let distance = this.pg.dist(lastNode.x, lastNode.y, tipNode.x, tipNode.y);
    if (distance < this.nodeSpacing) {
      tipNode.y += growthRate; //(dy / distance) * growthRate;
      const lastContraint = this.constraints[this.constraints.length - 1];
      lastContraint.length += growthRate; //growthRate;
    } else {
      this.createNode();
    }

    this.growLeaves(growthRate);
  }

  growLeaves(growthRate) {
    // Grow the leaves on existing nodes
    for (const node of this.nodes) {
      for (let leaf of node.leaves) {
        leaf.grow(growthRate * 0.4);
      }
    }
  }

  createNode() {
    this.nodeSpacing = this.pg.random(10, 30) * this.szFactor;
    let tipNode = this.nodes[this.nodes.length - 1];
    this.nodes.push({
      x: tipNode.x,
      y: tipNode.y,
      prevX: tipNode.x,
      prevY: tipNode.y,
      isFixed: false,
      leaves: this.createLeaves(), // Transfer leaves to the new node
    });

    tipNode = this.nodes[this.nodes.length - 1];
    const lastNode = this.nodes[this.nodes.length - 2];

    // Add a new constraint
    this.constraints.push({
      nodeA: lastNode,
      nodeB: tipNode,
      length: 0,
    });
  }

  // Apply attractive and repulsive forces between nodes
  applyForces(otherChains) {
    const otherNodes = otherChains.flatMap((chain) => chain.nodes);
    const attractStrength = 0.05; // Strength of attraction
    const repelStrength = 0.1; // Strength of repulsion
    const distanceThreshold = 100; // Max distance for interactions

    for (let i = 0; i < otherNodes.length; i++) {
      let nodeA = otherNodes[i];
      for (let j = i + 1; j < otherNodes.length; j++) {
        let nodeB = otherNodes[j];
        let dx = nodeB.x - nodeA.x;
        let dy = nodeB.y - nodeA.y;
        let distance = this.pg.sqrt(dx * dx + dy * dy);
        if (distance === 0 || distance > distanceThreshold) continue;

        // Normalize the vector
        let nx = dx / distance;
        let ny = dy / distance;

        // Attractive force (Hooke's Law)
        let attractForce = -attractStrength * (distance - this.nodeSpacing);

        // Repulsive force (Inverse-square law)
        let repelForce = repelStrength / (distance * distance);

        // Combine forces
        let totalForce = attractForce + repelForce;

        // Apply forces to nodes
        if (!nodeA.isFixed) {
          nodeA.x -= totalForce * nx;
          nodeA.y -= totalForce * ny;
        }
        if (!nodeB.isFixed) {
          nodeB.x += totalForce * nx;
          nodeB.y += totalForce * ny;
        }
      }
    }
  }

  update(otherNodes) {
    // this.applyForces(otherNodes);
    this.applyPhysics();
    this.applyKinks();
    this.enforceConstraints();
  }

  applyKinks() {
    // const time = 0;
    let time = frameCount * 0.01; // Slow time progression
    for (let i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i];
      if (!node.isFixed && node !== this.draggingNode) {
        let noiseX = noise(i * 1 + this.noiseOffset, time) * 2 - 1;
        let noiseY = noise(i * 0.2 + this.noiseOffset + 100, time) * 2 - 1;
        node.x += noiseX * 0.2; // Subtle horizontal offset
        node.y += noiseY * 0.05; // Subtle vertical offset
      }
    }
  }

  applyPhysics() {
    for (let node of this.nodes) {
      if (!node.isFixed && node !== this.draggingNode) {
        let vx = node.x - node.prevX;
        let vy = node.y - node.prevY;

        node.prevX = node.x;
        node.prevY = node.y;

        // Apply velocity, gravity, and damping
        node.x += vx * 0.99;
        node.y += vy * 0.99 + 0.2; // Gravity
      }
    }
  }

  enforceConstraints() {
    for (let constraint of this.constraints) {
      let dx = constraint.nodeB.x - constraint.nodeA.x;
      let dy = constraint.nodeB.y - constraint.nodeA.y;
      let distance = this.pg.dist(
        constraint.nodeA.x,
        constraint.nodeA.y,
        constraint.nodeB.x,
        constraint.nodeB.y,
      );
      let diff = (distance - constraint.length) / distance;

      if (!constraint.nodeA.isFixed && constraint.nodeA !== this.draggingNode) {
        constraint.nodeA.x += dx * diff * 0.5;
        constraint.nodeA.y += dy * diff * 0.5;
      }
      if (!constraint.nodeB.isFixed && constraint.nodeB !== this.draggingNode) {
        constraint.nodeB.x -= dx * diff * 0.5;
        constraint.nodeB.y -= dy * diff * 0.5;
      }
    }
  }

  display(pg = this.pg) {
    pg.noFill();
    pg.stroke(this.col);
    pg.strokeWeight(2);

    for (let constraint of this.constraints) {
      pg.line(
        constraint.nodeA.x,
        constraint.nodeA.y,
        constraint.nodeB.x,
        constraint.nodeB.y,
      );
    }

    for (let node of this.nodes) {
      for (let leaf of node.leaves) {
        leaf.display(node.x, node.y, pg);
      }
    }
  }

  handleMousePressed(pg = this.pg) {
    for (let node of this.nodes) {
      if (pg.dist(pg.mouseX, pg.mouseY, node.x, node.y) < 10) {
        this.draggingNode = node;
        break;
      }
    }
  }

  handleMouseDragged(pg = this.pg) {
    if (this.draggingNode) {
      this.draggingNode.x = pg.mouseX;
      this.draggingNode.y = pg.mouseY;
    }
  }

  handleMouseReleased() {
    this.draggingNode = null;
  }

  applyRepulsion(rx, ry, radius, strength) {
    for (const node of this.nodes) {
      if (node.isFixed) continue;
      const dx = node.x - rx;
      const dy = node.y - ry;
      const dSq = dx * dx + dy * dy;
      const rSq = radius * radius;
      if (dSq < rSq && dSq > 0) {
        const d = sqrt(dSq);
        const force = strength * (1 - d / radius);
        node.x += (dx / d) * force;
        node.y += (dy / d) * force;
      }
    }
  }
}

class Leaf {
  constructor(id, szFactor, pg) {
    this.pg = pg;
    let { angle, terminalLength, curvature, direction } = this.getLeaf(id);
    this.angle = angle;
    this.length = 0; // Current length
    this.curvature = curvature;
    this.direction = direction;
    this.terminalLength = terminalLength * szFactor; // Max length
  }

  getLeaf(id) {
    if (this.pg.random() < 0.3) {
      return this.getRandomLeaf();
    } else {
      return this.getNormalLeaf(id);
    }
  }

  getRandomLeaf() {
    let angle = this.pg.random(-this.pg.PI * 2, this.pg.PI * 2); // Random angle from the node
    let terminalLength = this.pg.random(20, 40); // Random length for the leaf
    let curvature = this.pg.random(0.2, 1); // Amount of curl
    let direction = this.pg.random([1, -1]); // Curl direction: 1 for right, -1 for left
    return { angle, terminalLength, curvature, direction };
  }

  getNormalLeaf(i) {
    const leafStates = [
      [3, 1],
      [0, -1],
      [this.pg.random(-this.pg.PI, this.pg.PI), this.pg.random([1, -1])],
    ];
    const leafState = leafStates[i % 2];
    let angle = leafState[0] + this.pg.random(-0.3, 0.3); //this.pg.random(-PI * 2, PI * 2); // Random angle from the node
    let terminalLength = this.pg.random(20, 40); // Random length for the leaf
    let curvature = this.pg.random(0.2, 1.3); // Amount of curl
    let direction = leafState[1]; //random([1, -1]); // Curl direction: 1 for right, -1 for left
    return { angle, terminalLength, curvature, direction };
  }

  // Grow the leaf until it reaches terminal length
  grow(growthRate) {
    if (this.length < this.terminalLength) {
      this.length += growthRate;
    }
  }

  display(nodeX, nodeY, pg = this.pg) {
    // stroke/strokeWeight/noFill already set by MossChain.display()
    const cosA = pg.cos(this.angle);
    const sinA = pg.sin(this.angle);
    const endX = nodeX + cosA * this.length;
    const endY = nodeY + sinA * this.length;
    const curlX = nodeX + cosA * (this.length / 2) + this.curvature * this.direction * sinA * this.length;
    const curlY = nodeY + sinA * (this.length / 2) - this.curvature * this.direction * cosA * this.length;

    pg.beginShape();
    pg.vertex(nodeX, nodeY);
    pg.quadraticVertex(curlX, curlY, endX, endY);
    pg.endShape();
  }
}
