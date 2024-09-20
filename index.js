const fs = require("fs");

fs.readFile("./orders.csv", "utf8", (err, data) => {
  if (err) {
    console.error("error reading the file", err);
    return;
  }
  const rows = data.split("\n");

  const headers = rows[0].split(",").map((header) => header.trim());
  const orders = rows
    .slice(1)
    .map((row) => {
      const values = row.split(",").map((values) => values.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index] !== undefined ? values[index] : null;
        return acc;
      }, {});
    })
    .filter((row) => row !== null);

  console.log(orders);
});
