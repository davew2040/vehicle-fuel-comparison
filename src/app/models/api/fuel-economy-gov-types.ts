export interface MenuItemApiResponse {
  text: string,
  value: string
}

export interface Trim {
  text: string,
  id: number
}

export interface DefaultApiResponse {
  [key: string]: any;
  menuItem: { text: string, value: string }[];
}

export interface TrimApiResponse {
  [key: string]: any;
  menuItem: { text: string, value: string };
}