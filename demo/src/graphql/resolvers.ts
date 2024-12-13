import { resolver as cow } from "./addProduct-resx"

export const resolvers = {
  Query: {},
  Mutation: {
    addProduct: cow,
  },
}
