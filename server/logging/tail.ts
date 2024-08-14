/**
 * Modified from generated cloudflare code
 */

function randomBetween0and1() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 4294967295;
}

function shouldSampleStatusCode(statusCode: string | number) {
  let samplingRate = 30;
  statusCode = String(statusCode);

  if (statusCode == "400") return true;
  else if (statusCode.substring(0, 1) == "5") return true;

  if (statusCode.substring(0, 1) == "2") samplingRate = 10;

  return randomBetween0and1() * 100 <= samplingRate;
}

export async function tail(items, env) {
  const itemsToSend = [];
  for (const item of items) {
    const { outcome, event, exceptions } = item;
    let isSampledRequest = false;
    if (event) {
      if ("request" in event) {
        const statusCode = event.response?.status || 500;
        if (outcome === "ok" && shouldSampleStatusCode(statusCode)) {
          isSampledRequest = true;
        }
      } else {
        isSampledRequest = true;
      }
    }
    if (isSampledRequest || exceptions.length) {
      itemsToSend.push(item);
    }
  }
  if (itemsToSend.length) {
    await fetch(env.BASELIME_API_URL || "https://cloudflare.baselime.io/v1", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.BASELIME_API_KEY,
        "x-dataset": env.BASELIME_DATASET,
        "x-service": "pf-api",
      },
      body: JSON.stringify(itemsToSend),
    });
  }
}
