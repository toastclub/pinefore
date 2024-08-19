export function getTitle(route: string) {
  let segments = route.split("/");
  //segments.shift();
  if (segments[segments.length - 1].endsWith("?")) {
    segments[segments.length - 1] = segments[segments.length - 1].slice(0, -1);
  }
  if (["me", "docs"].includes(segments[0])) {
    segments.shift();
  }
  return (
    segments[segments.length - 1].charAt(0).toUpperCase() +
    segments[segments.length - 1].slice(1)
  ).replaceAll("-", " ");
}

let map = {
  faq: "All the answers you could ever need",
  contact: "Get in touch with us",
  privacy: "Learn how we handle your data, and how you can control it",
  terms: "Our contract with you",
  refunds: "Refund policy",
  credits: "Software we use",
};

export function getSubtitle(route: string) {
  let segments = route.split("/");
  if (segments[segments.length - 1].endsWith("?")) {
    segments[segments.length - 1] = segments[segments.length - 1].slice(0, -1);
  }
  if (segments.at(-1) == "") {
    segments.pop();
  }
  return map[segments[segments.length - 1].toLowerCase()];
}
