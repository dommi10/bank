const express = require('express');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const models = require('./models');
const { typeDefs, resolvers } = require('./graphql');
const { ApolloServer } = require('apollo-server-express');
const dataLoader = require('./dataloader');
const fs = require('fs');
const cors = require('cors');
const https = require('https');
const { createServer } = require('http');
// const { execute, subscribe } = require('graphql');
// const { makeExecutableSchema } = require("graphql-tools");

// const schema = makeExecutableSchema({ typeDefs, resolvers });
const configurations = {
    // Note: You may need sudo to run on port 443
    production: { ssl: true, port: 443, hostname: 'api.site.com' },
    development: { ssl: false, port: 5000, hostname: 'localhost' }
}

// const environment = process.env.NODE_ENV || 'production'
const environment = 'development'
const config = configurations[environment]
const IN_PROD = environment;
const token = require('./middleware/is-auth');

const apollo = new ApolloServer({
    typeDefs, resolvers,
    playground: true,
    introspection: true,
    context: ({ req, connection }) => {
        if (connection) {
            // check connection for metadata
            return connection.context;
        } else {
            const toke = req.headers.authorization || '';
            const user = token(toke);
            return { models, dataLoader, user };
        }
    },
    subscriptions: {
        path: '/graphql',
        onConnect: (connectionParams, webSocket) => {
            if (connectionParams.authorization) {
                const toke = connectionParams.authorization || '';
                const user = token(toke);
                return user;
            }

            throw new Error('Vous devez vous authentifier!');
        }
    },
    cors: true
})
const path = '/'
const app = express()
app.use(cors())
apollo.applyMiddleware({ app, path })

// Create the HTTPS or HTTP server, per configuration
var server
if (config.ssl) {
    server = https.createServer(app)
} else {
    // server = https.createServer(app)
    server = createServer(app)
}

// Add subscription support
apollo.installSubscriptionHandlers(server)

server.listen({ port: config.port }, () => {
    console.log(
        '🚀 Server ready at',
        `http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${apollo.graphqlPath}`
    );
    console.log(
        '🚀 sub',
        `ws://${config.hostname}:${config.port}${apollo.subscriptionsPath}`
    );
}
)