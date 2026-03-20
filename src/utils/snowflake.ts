const Epoch = new Date("2026-01-01T00:00:00.000Z").getTime();

export function generateSnowflake() {
  const timestamp = Date.now() - Epoch;
  const random = Math.floor(Math.random() * 4096);
  return ((BigInt(timestamp) << 22n) | BigInt(random)).toString(10);
}

export function parseSnowflake(snowflake: bigint | number | string) {
  const id = BigInt(snowflake);
  const timestamp = (id >> 22n) + BigInt(Epoch);
  return new Date(Number(timestamp));
}
