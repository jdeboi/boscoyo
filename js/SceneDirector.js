class SceneDirector {
  constructor(scenes, { loop = true, startAtSceneId = null } = {}, pg) {
    this.rawScenes = scenes;
    this.scenes = compileScenesByDuration(scenes);
    this.startAtSceneId = startAtSceneId;
    this.pg = pg;

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

  goToScene(sceneId, { localSeconds = 0 } = {}, pg = this.pg) {
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

  _startSceneText(pg = this.pg, scene) {
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
    const wrapWidth = isQuestion ? 550 : pg.width - 60;
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

  _setActive(index, pg = this.pg) {
    if (index === this.activeIndex) return;

    const prev = this.scenes[this.activeIndex];
    if (prev?.onExit) prev.onExit(pg);
    this.activeIndex = index;

    const next = this.scenes[this.activeIndex];
    if (next?.onEnter) next.onEnter(pg);
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

  update(dtMs, pg = this.pg) {
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

  _drawText(pg = this.pg) {
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
      pg.textAlign(pg.LEFT, pg.CENTER);
      pg.textSize(54);
      pg.text(visible, 120, 0, 550, 800);
    } else {
      pg.textAlign(pg.LEFT, pg.TOP);
      pg.textSize(30);
      pg.translate(30, pg.height - 50);
      pg.text(visible, 0, 0);
    }

    pg.pop();
  }

  draw(pg = this.pg) {
    const active = this.scenes[this.activeIndex];
    if (!active) return;
    this.pg.push();
    if (shouldInvert) {
      this.pg.scale(-1, 1);
      this.pg.translate(-width, 0);
    }
    const localMs = this.t - active.startMs;
    active.draw?.(pg, { globalMs: this.t, localMs, scene: active });

    // draw text on top
    this._drawText(pg);
    this.pg.pop();
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
