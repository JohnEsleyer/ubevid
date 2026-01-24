
/**
 * A simple RK4 spring simulation for UI animations.
 * Based on common spring physics parameters.
 */
export class Spring {
  private position: number;
  private velocity: number;
  private target: number;
  
  // Physics constants
  private tension: number;
  private friction: number;
  private mass: number;

  constructor(initialValue: number = 0, config: { tension?: number, friction?: number, mass?: number } = {}) {
    this.position = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    
    this.tension = config.tension || 170;
    this.friction = config.friction || 26;
    this.mass = config.mass || 1;
  }

  set(target: number) {
    this.target = target;
  }

  // Simulate one frame (dt in seconds, e.g., 1/30)
  update(dt: number): number {
    const forces = (state: { p: number, v: number }) => {
      const stiffness = -this.tension * (state.p - this.target);
      const damping = -this.friction * state.v;
      return (stiffness + damping) / this.mass;
    };

    const initial = { p: this.position, v: this.velocity };

    const k1v = forces(initial);
    const k1p = initial.v;

    const k2v = forces({ p: initial.p + k1p * dt * 0.5, v: initial.v + k1v * dt * 0.5 });
    const k2p = initial.v + k1v * dt * 0.5;

    const k3v = forces({ p: initial.p + k2p * dt * 0.5, v: initial.v + k2v * dt * 0.5 });
    const k3p = initial.v + k2v * dt * 0.5;

    const k4v = forces({ p: initial.p + k3p * dt, v: initial.v + k3v * dt });
    const k4p = initial.v + k3v * dt;

    this.velocity += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    this.position += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);

    return this.position;
  }

  get() { return this.position; }
}
