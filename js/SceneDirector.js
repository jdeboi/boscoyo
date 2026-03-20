// start at the beginning of pirogue scene, and play sequentially
const START_SCENE_ID = "moss";
let treeY = 0;
const history1 = [
  "For thousands of years, cypress forests filled the Louisiana swamps,",
  "and were among the largest forest ecosystems in North America.",
  "Some trees reached more than a thousand years in age,",
  "standing as big and magnificent as the redwoods.",
];

const history2 = [
  "By the 1920s, most of these ancient trees had been logged,",
  "leaving only scattered remnants and submerged stumps.",
  "The memory of those original forests has largely been forgotten",
  "making it difficult to fully grasp what the swamp once was,",
  "and what it could be.",
];

const questions = [
  "What responsibility do we have to understand the losses we inherited?",
  "What does it mean to care for a landscape we only partially remember?",
  "What futures become imaginable when our forgotten history resurfaces?",
];

const scenes = [
  {
    id: "intro",
    durationSeconds: 4,
    draw: displayTitle,
    onEnter: () => {
      textFont(font);
    },
  },
  {
    id: "treeSpan",
    durationSeconds: 30,
    textCuesDelaySeconds: 4,

    draw: displayTreeSpan,
    textCues: history1,
  },
  {
    id: "birdBigTree1",
    durationSeconds: 15,
    draw: displayBirdBigTree1,
    onEnter: () => {
      bird.x = 0;
    },

    textCues: [],
  },
  {
    id: "pirogue",
    durationSeconds: 25,
    textCueDelaySeconds: 2,
    draw: displayPirogueBig,
    onEnter: () => {
      xPosition = 0;
      pirogue.x = -400;
    },
    textCues: history2,
  },

  {
    id: "lotus",
    durationSeconds: 20,
    draw: displayLotus,
  },
  {
    id: "duckweed",
    durationSeconds: 30,
    draw: displayDuckweed,
  },
  {
    id: "moss",
    durationSeconds: 30,
    draw: displayMossScene,
  },
  {
    id: "bigTreeQuestions",
    durationSeconds: 8,
    draw: displayBigTreeQuestions1,
    onEnter: () => {
      bird.x = width - 500;
      bird.y = height / 2;
    },
  },
  {
    id: "bigTreeQuestions2",
    durationSeconds: 8,
    draw: displayBigTreeQuestions2,
  },
  {
    id: "bigTreeQuestions3",
    durationSeconds: 4,
    draw: displayBigTreeQuestionsNo,
    onExit: () => {
      bird.x = 0;
      bird.y = height - 180;
    },
  },
  {
    id: "treesAndPirogue",
    durationSeconds: 20,
    draw: displayPirogue,
    textCues: [],
    onEnter: () => {
      xPosition = 0;
      pirogue.x = 0;
    },
    onExit: () => {
      resetAnimation();
    },
  },
];

function displayTitle(pg) {
  textAlign(CENTER, CENTER);
  fill(255);
  noStroke();
  textSize(180);
  text("Boscoyo", width / 2, height / 2 - 40);

  textSize(44);
  fill(200);
  text("(Cypress Knees)", width / 2, height / 2 + 120);
}

function displayTreeSpan(pg) {
  textFont("monospace");
  xPosition -= 0.5;

  for (const tree of trees) {
    tree.display(xPosition);
  }
}

function displayPirogue(pg) {
  textFont("monospace");
  xPosition--;

  push();
  scale(1.2);
  pirogue.display();
  pirogue.update();

  for (const tree of trees) {
    tree.display(xPosition);
  }
  pop();
}

function displayPirogueBig(pg) {
  textFont("monospace");
  xPosition--;
  pirogue.y = 100;

  push();
  scale(2);
  translate(0, -500);
  trees[1].display(-600);
  pop();

  push();
  scale(1.5);
  pirogue.display();
  pirogue.update();
  pirogue.move(1);
  pop();
}

function displayBirdBigTree1(pg) {
  textFont("monospace");
  push();

  scale(1.6);
  translate(0, -180);
  trees[2].display(-width * 0.9);
  pop();

  push();
  bird.display();
  bird.update();
  pop();
}

function displayQuestion(question, pg) {
  xPosition--;
  textFont("monospace");

  push();
  fill(255);
  textAlign(LEFT, CENTER);
  textSize(54);
  text(question, width / 2 + 50, 0, 550, 800);
  pop();

  push();
  scale(1.8);
  translate(0, -200);
  trees[1].display(-1000);
  pop();

  push();
  scale(1.4);
  bird.displayBackward();
  bird.update();
  bird.move(-1);
  pop();
}

function displayBigTreeQuestions1(pg) {
  displayQuestion(questions[1], pg);
}

function displayBigTreeQuestions2(pg) {
  displayQuestion(questions[2], pg);
}

function displayBigTreeQuestionsNo(pg) {
  displayQuestion("", pg);
}

class SceneDirector {
  constructor(scenes, { loop = true, startAtSceneId = null } = {}, pg) {
    this.rawScenes = scenes;
    this.scenes = compileScenesByDuration(scenes);
    this.startAtSceneId = startAtSceneId;

    this.totalMs = this.scenes.length
      ? this.scenes[this.scenes.length - 1].endMs
      : 0;

    this.loop = loop;
    this.t = 0;
    this.activeIndex = -1;

    // ---- text timing knobs ----
    this.typeSpeedMs = 40;
    this.phraseHoldMs = 2200;

    // ---- text runtime state ----
    this.text = {
      started: false, // ⬅️ NEW: has text started for this scene?
      startDelayMs: 0, // ⬅️ NEW
      active: false,
      type: "bottomText", // or "question"
      revealByLetter: true,
      cuesWrapped: [],
      index: 0,
      charCount: 0,
      charTimer: 0,
      holdTimer: 0,
      done: true,
    };

    if (this.startAtSceneId) {
      this.goToScene(this.startAtSceneId, { localSeconds: 0 }, pg);
    }
  }

  goToScene(sceneId, { localSeconds = 0 } = {}, pg) {
    const idx = this.scenes.findIndex((s) => s.id === sceneId);
    if (idx === -1) return;

    const scene = this.scenes[idx];

    // set global time so we land inside the scene
    const localMs = Math.max(0, localSeconds * 1000);
    this.t = scene.startMs + Math.min(localMs, scene.durationMs - 1);

    // force active switch + re-init text etc.
    this._setActive(idx, pg);

    // IMPORTANT: if you jump to a time after the delay, start text immediately
    const active = this.scenes[this.activeIndex];
    const activeLocalMs = this.t - active.startMs;

    if (
      this.text.cuesWrapped.length > 0 &&
      !this.text.started &&
      activeLocalMs >= this.text.startDelayMs
    ) {
      this.text.started = true;
      this.text.active = true;

      while (
        this.text.index < this.text.cuesWrapped.length &&
        this.text.cuesWrapped[this.text.index].trim() === ""
      ) {
        this.text.index++;
      }

      // call onEnter hook if any
      if (active?.onEnter) active.onEnter();
    }
  }

  reset() {
    this.t = 0;
    this.activeIndex = -1;
    this._resetText();
  }

  _resetText() {
    this.text.active = false;
    this.text.cuesWrapped = [];
    this.text.index = 0;
    this.text.charCount = 0;
    this.text.charTimer = 0;
    this.text.holdTimer = 0;
    this.text.done = true;
  }

  _startSceneText(pg, scene) {
    const raw = scene.textCues ?? [];
    if (!raw.length) {
      this._resetText();
      return;
    }

    const type = scene.textType ?? "bottomText";
    const isQuestion = type === "question";

    pg.push();
    pg.textFont("monospace");
    pg.textSize(isQuestion ? 54 : 30);
    const wrapWidth = isQuestion ? 550 : width - 60;
    const wrapped = raw.map((s) => wrapPhraseToWidth(pg, s, wrapWidth));
    pg.pop();

    this.text.active = false; // ⬅️ not active yet
    this.text.started = false; // ⬅️ not started yet
    this.text.startDelayMs = (scene.textCuesDelaySeconds ?? 0) * 1000;

    this.text.type = type;
    this.text.revealByLetter = scene.isRevealedByLetter ?? !isQuestion;
    this.text.cuesWrapped = wrapped;

    this.text.index = 0;
    this.text.charCount = 0;
    this.text.charTimer = 0;
    this.text.holdTimer = 0;
  }

  _setActive(index, pg) {
    if (index === this.activeIndex) return;

    const prev = this.scenes[this.activeIndex];
    if (prev?.onExit) prev.onExit();

    this.activeIndex = index;

    const next = this.scenes[this.activeIndex];
    if (next?.onEnter) next.onEnter();

    // start text for the new scene
    this._startSceneText(pg, next);
  }

  _advanceTextCue() {
    this.text.index++;
    this.text.charCount = 0;
    this.text.charTimer = 0;
    this.text.holdTimer = 0;

    // skip blank cues
    while (
      this.text.index < this.text.cuesWrapped.length &&
      this.text.cuesWrapped[this.text.index].trim() === ""
    ) {
      this.text.index++;
    }

    if (this.text.index >= this.text.cuesWrapped.length) {
      // finished all cues => no text for rest of scene
      this._resetText();
    }
  }

  _updateText(dtMs) {
    if (!this.text.active) return;

    const full = this.text.cuesWrapped[this.text.index];
    if (!full) {
      this._advanceTextCue();
      return;
    }

    if (!this.text.revealByLetter) {
      // instant reveal, just hold
      this.text.holdTimer += dtMs;
      if (this.text.holdTimer >= this.phraseHoldMs) this._advanceTextCue();
      return;
    }

    // typewriter
    if (this.text.charCount < full.length) {
      this.text.charTimer += dtMs;
      while (
        this.text.charTimer >= this.typeSpeedMs &&
        this.text.charCount < full.length
      ) {
        this.text.charCount++;
        this.text.charTimer -= this.typeSpeedMs;
      }
    } else {
      this.text.holdTimer += dtMs;
      if (this.text.holdTimer >= this.phraseHoldMs) this._advanceTextCue();
    }
  }

  update(dtMs, pg) {
    if (!this.totalMs) return;

    this.t += dtMs;

    if (this.loop) {
      this.t = ((this.t % this.totalMs) + this.totalMs) % this.totalMs;
    } else if (this.t >= this.totalMs) {
      this.t = this.totalMs;
    }

    const idx = this.scenes.findIndex(
      (s) => this.t >= s.startMs && this.t < s.endMs,
    );
    this._setActive(idx === -1 ? this.scenes.length - 1 : idx, pg);

    const active = this.scenes[this.activeIndex];
    if (!active) return;

    const localMs = this.t - active.startMs;

    // -------------------------------
    // 🆕 START TEXT AFTER DELAY
    // -------------------------------
    if (
      this.text.cuesWrapped.length > 0 &&
      !this.text.started &&
      localMs >= this.text.startDelayMs
    ) {
      this.text.started = true;
      this.text.active = true;

      // optional: skip empty cues
      while (
        this.text.index < this.text.cuesWrapped.length &&
        this.text.cuesWrapped[this.text.index].trim() === ""
      ) {
        this.text.index++;
      }
    }

    // update scene-specific update hook
    if (active.update) {
      active.update(dtMs, { globalMs: this.t, localMs, scene: active });
    }

    // update text AFTER active scene is set and delay passed
    this._updateText(dtMs);
  }

  _drawText(pg) {
    if (!this.text.active) return;

    const full = this.text.cuesWrapped[this.text.index];
    const visible = this.text.revealByLetter
      ? full.substring(0, this.text.charCount)
      : full;

    pg.push();
    pg.fill(255);
    pg.noStroke();
    pg.textFont("monospace");

    if (this.text.type === "question") {
      pg.textAlign(LEFT, CENTER);
      pg.textSize(54);
      pg.text(visible, 120, 0, 550, 800);
    } else {
      pg.textAlign(LEFT, TOP);
      pg.textSize(30);
      pg.translate(30, height - 50);
      pg.text(visible, 0, 0);
    }

    pg.pop();
  }

  draw(pg) {
    const active = this.scenes[this.activeIndex];
    if (!active) return;

    const localMs = this.t - active.startMs;
    active.draw?.(pg, { globalMs: this.t, localMs, scene: active });

    // draw text on top
    this._drawText(pg);
  }
}

function compileScenesByDuration(scenes) {
  let t = 0;
  return scenes.map((s) => {
    const startMs = t;
    const durationMs = (s.durationSeconds ?? 0) * 1000;
    const endMs = startMs + durationMs;
    t = endMs;
    return { ...s, startMs, endMs, durationMs };
  });
}
function wrapPhraseToWidth(pg, phrase, wrapWidth) {
  const words = phrase.split(" ");
  let lines = [];
  let current = "";

  for (let w of words) {
    const test = current ? current + " " + w : w;
    if (pg.textWidth(test) <= wrapWidth) current = test;
    else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.join("\n");
}
