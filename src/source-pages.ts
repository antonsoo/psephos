export const sourcePages = {
  "67": {
    label: "LXVII",
    image: "sources/kenyon-p67.jpg",
    leaf: 81,
    description: "68.2–3, with the beginning of 68.4 and the critical apparatus",
  },
  "68": {
    label: "LXVIII",
    image: "sources/kenyon-p68.jpg",
    leaf: 82,
    description: "68.4–69, with the critical apparatus",
  },
  title: {
    label: "Title page",
    image: "sources/kenyon-title.jpg",
    leaf: 7,
    description: "Kenyon’s title page naming the editor and Clarendon Press",
  },
  imprint: {
    label: "Imprint",
    image: "sources/kenyon-imprint.jpg",
    leaf: 8,
    description: "The imprint says first published 1920 and lists reprints through 1958",
  },
} as const;

export function sourcePage(key: string): (typeof sourcePages)[keyof typeof sourcePages] {
  return Object.hasOwn(sourcePages, key)
    ? sourcePages[key as keyof typeof sourcePages]
    : sourcePages["67"];
}
