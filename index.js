const fs = require("fs");
const csv = require("csv-parser");
const orders = [];

const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => orders.push(data))
      .on("end", () => {
        resolve(orders);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const totalExpenditurePerCustomer = () => {
  const expenditure = {};

  orders.forEach((order) => {
    const totalSpent = order.quantity * order.price_per_unit;
    if (expenditure[order.customer_id]) {
      expenditure[order.customer_id] += totalSpent;
    } else {
      expenditure[order.customer_id] = totalSpent;
    }
  });

  const customerSpending = Object.keys(expenditure).map((customer_id) => ({
    customer_id,
    total_spent: expenditure[customer_id],
  }));

  customerSpending.sort((a, b) => b.total_spent - a.total_spent);
  console.table(customerSpending);

  console.log("Top 5 Customers who spent the most:");
  console.table(customerSpending.slice(0, 5));

  return customerSpending;
};

readCSV("orders.csv").then(() => {
  totalExpenditurePerCustomer();
});
