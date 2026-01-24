
/**
 * A simple Perlin-like Noise implementation for 3D (x, y, z).
 * Based on standard permutation table approach.
 */
export class Noise {
  private p: Uint8Array;
  private perm: Uint8Array;

  constructor(seed: number = 0) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.seed(seed);
  }

  seed(val: number) {
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    
    // Shuffle based on seed
    let buffer = new Float64Array(1);
    const nextRand = () => {
       val = (val * 1664525 + 1013904223) % 4294967296;
       return val / 4294967296;
    };

    for (let i = 0; i < 256; i++) {
      const r = Math.floor(nextRand() * (256 - i)) + i;
      const temp = this.p[i];
      this.p[i] = this.p[r];
      this.p[r] = temp;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }

  fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t: number, a: number, b: number) { return a + t * (b - a); }
  grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public perlin3(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;

    return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z),
      this.grad(this.perm[BA], x - 1, y, z)),
      this.lerp(u, this.grad(this.perm[AB], x, y - 1, z),
      this.grad(this.perm[BB], x - 1, y - 1, z))),
      this.lerp(v, this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1),
      this.grad(this.perm[BA + 1], x - 1, y, z - 1)),
      this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1),
      this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))));
  }
}