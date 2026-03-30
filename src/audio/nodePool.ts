/**
 * WebAudio Node Pool
 * Reuses audio nodes to avoid allocation overhead on every note
 */

export class NodePool {
  private ctx: AudioContext;
  private gainPool: GainNode[] = [];
  private filterPool: BiquadFilterNode[] = [];
  private pannerPool: StereoPannerNode[] = [];
  private delayPool: DelayNode[] = [];

  constructor(ctx: AudioContext, initialSize: number = 16) {
    this.ctx = ctx;
    this._preallocate(initialSize);
  }

  private _preallocate(count: number) {
    for (let i = 0; i < count; i++) {
      this.gainPool.push(this.ctx.createGain());
      this.filterPool.push(this.ctx.createBiquadFilter());
      this.pannerPool.push(this.ctx.createStereoPanner());
      this.delayPool.push(this.ctx.createDelay(1.0));
    }
  }

  getGain(): GainNode {
    let node = this.gainPool.pop();
    if (!node) {
      node = this.ctx.createGain();
    }
    // Reset to defaults
    node.gain.cancelScheduledValues(this.ctx.currentTime);
    node.gain.value = 1;
    return node;
  }

  getFilter(): BiquadFilterNode {
    let node = this.filterPool.pop();
    if (!node) {
      node = this.ctx.createBiquadFilter();
    }
    // Reset to defaults
    node.frequency.cancelScheduledValues(this.ctx.currentTime);
    node.Q.cancelScheduledValues(this.ctx.currentTime);
    node.frequency.value = 350;
    node.Q.value = 1;
    return node;
  }

  getPanner(): StereoPannerNode {
    let node = this.pannerPool.pop();
    if (!node) {
      node = this.ctx.createStereoPanner();
    }
    node.pan.cancelScheduledValues(this.ctx.currentTime);
    node.pan.value = 0;
    return node;
  }

  getDelay(): DelayNode {
    let node = this.delayPool.pop();
    if (!node) {
      node = this.ctx.createDelay(1.0);
    }
    node.delayTime.cancelScheduledValues(this.ctx.currentTime);
    node.delayTime.value = 0.3;
    return node;
  }

  returnGain(node: GainNode) {
    node.disconnect();
    this.gainPool.push(node);
  }

  returnFilter(node: BiquadFilterNode) {
    node.disconnect();
    this.filterPool.push(node);
  }

  returnPanner(node: StereoPannerNode) {
    node.disconnect();
    this.pannerPool.push(node);
  }

  returnDelay(node: DelayNode) {
    node.disconnect();
    this.delayPool.push(node);
  }

  // Drain pools to prevent memory leaks
  dispose() {
    [...this.gainPool, ...this.filterPool, ...this.pannerPool, ...this.delayPool].forEach(n => n.disconnect());
    this.gainPool = [];
    this.filterPool = [];
    this.pannerPool = [];
    this.delayPool = [];
  }
}
