/* in progress */
export default class ZRanker {
  count: number;
  total: number;
  totalSq: number;
  constructor(
    decay: string,
    data:
      | number[]
      | {
          count: number;
          total: number;
          totalSq: number;
        } = [1]
  ) {
    if (Array.isArray(data)) {
      this.count = data.length;
      this.total = data.reduce((a, b) => a + b, 0);
      this.totalSq = data.reduce((a, b) => a + b ** 2, 0);
    } else {
      this.count = data.count;
      this.total = data.total;
      this.totalSq = data.totalSq;
    }
  }
  get mean() {
    return this.total / this.count;
  }
  get variance() {
    return this.totalSq / this.count - this.mean ** 2;
  }
  get stdDev() {
    return Math.sqrt(this.variance);
  }
  score(newValue?: number) {}
}
