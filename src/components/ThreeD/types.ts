export type KeyState = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
};

export type Interactable = {
  id: string;
  name: string;
  position: [number, number, number];
};
