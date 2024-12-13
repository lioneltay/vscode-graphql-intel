const products = [
  { id: '1', name: 'Laptop', price: 999.99, description: 'A high performance laptop' },
  { id: '2', name: 'Phone', price: 699.99, description: 'A smartphone with a great camera' },
];

const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
];

const orders = [
  { id: '1', productId: '1', userId: '1', quantity: 1 },
  { id: '2', productId: '2', userId: '2', quantity: 2 },
];

export const resolvers = {
  Query: {
    products: () => products,
    product: (parent, args) => products.find(product => product.id === args.id),
    users: () => users,
    user: (parent, args) => users.find(user => user.id === args.id),
    orders: () => orders,
    order: (parent, args) => orders.find(order => order.id === args.id),
  },
  Mutation: {
    addProduct: (parent, args) => {
      const newProduct = { id: `${products.length + 1}`, ...args };
      products.push(newProduct);
      return newProduct;
    },
    addUser: (parent, args) => {
      const newUser = { id: `${users.length + 1}`, ...args };
      users.push(newUser);
      return newUser;
    },
    addOrder: (parent, args) => {
      const newOrder = { id: `${orders.length + 1}`, ...args };
      orders.push(newOrder);
      return newOrder;
    },
  },
  Product: {
    orders: (parent) => orders.filter(order => order.productId === parent.id),
  },
  User: {
    orders: (parent) => orders.filter(order => order.userId === parent.id),
  },
  Order: {
    product: (parent) => products.find(product => product.id === parent.productId),
    user: (parent) => users.find(user => user.id === parent.userId),
  },
};
