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

const findTopCustomers = () => {
  const customerPurchaseCounts = {};
  const productSales = {};

  orders.forEach((order) => {
    const customerId = order.customer_id;
    const productId = order.product_id;
    const quantity = parseInt(order.quantity);

    if (customerId === "INVALID_ID") {
      return;
    }

    // Update customer purchase counts
    customerPurchaseCounts[customerId] =
      (customerPurchaseCounts[customerId] || 0) + quantity;

    // Update product sales
    productSales[productId] = (productSales[productId] || 0) + quantity;
  });

  // Find top customers
  const maxPurchases = Math.max(...Object.values(customerPurchaseCounts));
  const topCustomers = Object.keys(customerPurchaseCounts).filter(
    (customerId) => customerPurchaseCounts[customerId] === maxPurchases
  );

  // Find most popular product
  const bestSellingProduct = Object.keys(productSales).reduce((a, b) =>
    productSales[a] > productSales[b] ? a : b
  );
  const totalUnitsSold = productSales[bestSellingProduct];
  const customersWithHighestTotalPurchases = topCustomers.map(
    (customer_id) => ({
      customer_id,
    })
  );

  console.log(`Customers with the highest total purchases (${maxPurchases}):`);
  console.table(customersWithHighestTotalPurchases);
  console.log(`\nMost popular product:`);
  console.log(`Product ID: ${bestSellingProduct}`);
  console.log(`Total units sold: ${totalUnitsSold}`);
};

const calculateMonthlyRevenue = () => {
  const monthlyRevenue = {};
  const customerLastOrders = {};

  const latestOrderDate = orders.reduce((latest, order) => {
    const orderDate = new Date(order.order_date);
    return orderDate > latest ? orderDate : latest;
  }, new Date(0));
  console.log(latestOrderDate);
  // Calculate the cutoff date for inactive customers (6 months ago)
  const inactiveCutoffDate = new Date(
    latestOrderDate.setMonth(latestOrderDate.getMonth() - 6)
  );
  console.log(inactiveCutoffDate);

  orders.forEach((order) => {
    const orderDate = new Date(order.order_date);
    if (isNaN(orderDate.getTime())) {
      return;
    }
    const yearMonth = `${orderDate.getFullYear()}-${String(
      orderDate.getMonth() + 1
    ).padStart(2, "0")}`;
    const revenue = parseFloat(order.price_per_unit) * parseInt(order.quantity);
    if (!Number(revenue)) {
      return;
    }

    monthlyRevenue[yearMonth] = (monthlyRevenue[yearMonth] || 0) + revenue;
    const customerId = order.customer_id;
    if (
      !customerLastOrders[customerId] ||
      orderDate > customerLastOrders[customerId]
    ) {
      customerLastOrders[customerId] = orderDate;
    }
  });
  const inactiveCustomers = Object.keys(customerLastOrders).filter(
    (customerId) => customerLastOrders[customerId] < inactiveCutoffDate
  );

  const revenueResult = Object.keys(monthlyRevenue).map((yearMonth) => ({
    yearMonth,
    revenue: monthlyRevenue[yearMonth],
  }));

  console.log("\nthe revenue for each month is:");
  console.table(revenueResult);

  console.log("\nInactive customers (no orders in the last 6 months):");
  const customersWithNoOrders = inactiveCustomers.map((customer_id) => ({
    customer_id,
    last_order_date: customerLastOrders[customer_id]
      .toISOString()
      .split("T")[0],
  }));
  console.table(customersWithNoOrders);
};

const filterOrders = ({
  start_date = null,
  end_date = null,
  min_spent = null,
  product_id = null,
}) => {
  let filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);

    // Check if order_date is a valid date
    if (isNaN(orderDate.getTime())) {
      return false;
    }

    // Filter by start_date
    if (start_date && orderDate < new Date(start_date)) return false;

    // Filter by end_date
    if (end_date && orderDate > new Date(end_date)) return false;

    // Filter by product_id
    if (product_id && order.product_id !== product_id) return false;

    return true;
  });

  // Filter by min_spent (across all customer orders)
  if (min_spent) {
    const customerSpent = {};
    filteredOrders.forEach((order) => {
      const customerId = order.customer_id;
      customerSpent[customerId] =
        (customerSpent[customerId] || 0) +
        parseFloat(order.price_per_unit) * parseInt(order.quantity);
    });

    filteredOrders = filteredOrders.filter(
      (order) => customerSpent[order.customer_id] >= min_spent
    );
  }

  console.log("Filtered Orders:");
  console.log(filteredOrders);

  return filteredOrders;
};

readCSV("orders.csv").then(() => {
  totalExpenditurePerCustomer();
  findTopCustomers();
  calculateMonthlyRevenue();
  filterOrders({
    start_date: "2022-01-01",
    end_date: "2024-12-31",
    min_spent: 10,
    product_id: "226057c4-4841-42ac-978b-6dbbb9678c31",
  });
});
