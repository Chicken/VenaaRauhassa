import bent from "bent";

export const postJSON = bent("POST", "json", {
  "User-Agent": "VenaaRauhassa (https://github.com/Chicken/VenaaRauhassa)",
});
export const getJSON = bent("GET", "json", {
  "User-Agent": "VenaaRauhassa (https://github.com/Chicken/VenaaRauhassa)",
});
