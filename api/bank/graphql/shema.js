const {ApolloServer, gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  "Type personne"
  type Personne{
    id: Int!
    nom: String!
    postnom: String!
    prenom: String!
    dateN: Date!
    addresse: String!
  }

  "Type Equipe"
  type Equipe{
    id: Int!
    designation: String!
    dateCreation: Date!
    slogant: String
  }

  "Type Login"
  type Login{
    id: Int!
    username: String!
    personne: Personne
    token: String
  }

  "Type User"
  type User{
    username: String!
    passwords: String!
  }

  "Type ville"
  type Ville{
    id: Int!
    designation: String!
    ajout: Date!
  }

  "Type saison"
  type Saison{
    id: Int!
    designation: String!
    datedebut: Date!
    datefin: Date!
  }

  "Queries"
  type RootQuery {
    personnes(
      limit: Int!
     offset: Int!): [Personne]

    equipes(
    limit: Int!
     offset: Int!): [Equipe]

     login(
      username: String!
      passwords: String!
     ):Login

    villes(
    limit: Int!
    offset: Int!
    orderBy:[[String]]): [Ville]

    saisons(
    limit: Int!
    offset: Int!
    orderBy:[[String]]): [Saison]

    uploads: [File]
  }
 
  "Subscriptions"
  type RootSubscription {
    personneAdded:Personne
    equipeAdded:Equipe
  }


  "Mutations"
  type RootMutation {

    singleUpload(file: Upload!): File!

    addPersonne(
      nom: String!
    ):Personne

    addEquipe(
      designation: String!
      dateCreation: Date!
      slogant: String
    ): Equipe

    addUser(
      username: String!
      passwords: String!
      personneId: Int
    ) : Login

    addVille(
      designation: String!
    ) : Ville

    addSaison(
      designation: String!
      datedebut: Date!
      datefin: Date!
    ) : Saison
  }
  
  schema{
    query: RootQuery
    mutation : RootMutation
    subscription: RootSubscription
  }
`;

module.exports = typeDefs;
