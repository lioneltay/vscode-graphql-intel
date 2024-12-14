import { resolver as cow } from "./addProduct"

export const resolvers = {
  Query: {},
  Mutation: {
    addProduct: cow,
  },
}
