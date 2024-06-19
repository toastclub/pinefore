export function getUserAgentString(
  headers: Record<string, string | undefined>
) {
  let string = "";
  if (headers["user-agent"]) {
    return headers["user-agent"];
  }
  string = headers["sec-ch-ua"] || "";
  if (headers["sec-ch-ua-platform"]) {
    string += " " + headers["sec-ch-ua-platform"];
  }
  return string;
}

export function getIp(headers: Record<string, string | undefined>) {
  return (
    headers["cf-connecting-ip"] ||
    headers["x-forwarded-for"] ||
    headers["x-real-ip"] ||
    headers["x-client-ip"]
  );
}
