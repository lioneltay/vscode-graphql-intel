import express from "express"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import cors from "cors"

import { resolvers } from "./resolvers"
import * as fs from "fs"
import * as path from "path"
import * as glob from "glob"

// Combine all .gql files into a single schema
const gqlFiles = glob.sync(path.join(__dirname, "schema", "*.gql"))
const typeDefs = gqlFiles
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n")

async function startServer() {
  const app = express()

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  // Note you must call `start()` on the `ApolloServer`
  // instance before passing the instance to `expressMiddleware`
  await server.start()

  // Specify the path where we'd like to mount our server
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server),
  )

  app.listen({ port: 4000 }, () =>
    console.log(
      `🚀 Server ready at http://localhost:4000/graphql`,
    ),
  )
}

startServer().catch((err) => console.error(err))
