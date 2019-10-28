const { PubSub, ApolloError, withFilter } = require('apollo-server-express');
const bcrypt = require('bcrypt');
const pubsub = new PubSub();
const PERSONNE_ADDED = 'PERSONNE_ADDED';
const EQUIPE_ADDED = 'EQUIPE_ADDED';
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const jwt = require('jsonwebtoken');
const fs = require('fs')
const path = require('path')
const uuidv4 = require('uuid/v4');

const resolvers = {
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value;
        },
        parseLiteral(ast) {

            return ast.kind === Kind.STRING ?
                [(new Date(ast.value).getMonth() + 1) < 10 ? '0' + (new Date(ast.value).getMonth() + 1) : new Date(ast.value).getMonth() + 1,
                new Date(ast.value).getDate() < 10 ? '0' + new Date(ast.value).getDate() : new Date(ast.value).getDate(),
                new Date(ast.value).getFullYear()].join('-') + ' ' +
                [new Date(ast.value).getHours() < 10 ? '0' + new Date(ast.value).getHours() : new Date(ast.value).getHours(),
                new Date(ast.value).getMinutes() < 10 ? '0' + new Date(ast.value).getMinutes() : new Date(ast.value).getMinutes(),
                new Date(ast.value).getSeconds() < 10 ? '0' + new Date(ast.value).getSeconds() : new Date(ast.value).getSeconds()].join(':') : null;
        },
    }),
    RootSubscription: {
        personneAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => {
                pubsub.asyncIterator([PERSONNE_ADDED])
            },
        },
        equipeAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => pubsub.asyncIterator([EQUIPE_ADDED]),
        },
    },
    RootQuery: {
        personnes: (parent, args, { models, user }) => {
            if (!user)
                return new Error("vous devez vous authentifiez d'abord");
            return models.personne.findAll({
                limit: args.limit,
                offset: args.offset
            })
        },
        equipes: (parent, args, { models, user }) => {
            if (!user)
                return new Error("vous devez vous authentifiez d'abord");
            return models.equipe.findAll({
                limit: args.limit,
                offset: args.offset
            })
        },
        villes: (parent, args, { models, user }) => {
            if (!user)
                return new Error("vous devez vous authentifiez d'abord");
            try {
                if (!args.orderBy)
                    args.orderBy = [['id', 'desc']];
                return models.ville.findAll({
                    limit: args.limit,
                    offset: args.offset,
                    order: args.orderBy
                })
            } catch (error) {
                return new Error("une erreur est survenue, reessayer!");
            }
        },
        saisons: (parent, args, { models, user }) => {
            if (!user)
                return new Error("vous devez vous authentifiez d'abord");
            try {
                if (!args.orderBy)
                    args.orderBy = [['id', 'desc']];
                return models.saison.findAll({
                    limit: args.limit,
                    offset: args.offset,
                    order: args.orderBy
                })
            } catch (error) {
                return new Error("une erreur est survenue, reessayer!");
            }
        },
        login: async (parent, args, { models }) => {
            try {
                const user = await models.user.findOne({
                    where: {
                        username: args.username
                    }
                });
                if (!user) {
                    return new Error("le nom d'utilisateur ou le mot de passe incorrect");
                }
                const res = await bcrypt.compare(args.passwords, user.passwords);
                if (!res)
                    return new Error("le nom d'utilisateur ou le mot de passe incorrect");
                const token = await jwt.sign({
                    userId: user.id,
                }, ',(F-h"FL&,YP,P7xf#FeBT/K9>#o',
                    {
                        expiresIn: '24h'
                    });
                user.token = token;
                return user;

            } catch (error) {
                console.log(error);
                return new Error("Une erreur est survenue");
            }
        },

    },
    RootMutation: {
        singleUpload: async (parent, args, { models, user }) => {
            if (!user)
                return new Error("vous devez vous authentifiez d'abord");
            const { filename, mimetype, createReadStream } = await args.file;
            let extension = path.extname(filename);
            let f;
            let filesize = 0;
            let stream = createReadStream();
            stream.on("data", chunk => {
                filesize += chunk.length;
            });
            stream.once("end", () => {
                const f = fs.createWriteStream("./storage/" + uuidv4() + extension);
                fs.readFile(stream.path, (err, data) => {
                    f.write(data)
                })
            }
            );
            stream.on("error", () => new Error('une erreur est survenue, veiller reessayer !'));
            return f;

        },
        addEquipe: async (parent, args, { models, user }) => {
            try {
                if (!user)
                    return new Error("vous devez vous authentifiez d'abord");
                const equipe = await models.equipe.findOne({
                    where: {
                        designation: args.designation
                    }
                });

                if (equipe != null)
                    return new Error('une equipe possèdant le meme nom existe déjà');

                const val = await models.equipe.create({
                    designation: args.designation,
                    dateCreation: args.dateCreation + ' Z',
                    slogant: args.slogant
                });

                pubsub.publish(EQUIPE_ADDED, {
                    equipeAdded: val
                });
                return val;
            } catch (error) {
                console.log(error);
                return new Error('une erreur est survenue, veiller reessayer !');
            }
        },
        addUser: async (parent, args, { models, user }) => {
            try {
                // console.log(args.dateCreation + ' Z');
                if (!user)
                    return new Error("vous devez vous authentifiez d'abord");
                const users = await models.user.findOne({
                    where: {
                        username: args.username
                    }
                });

                if (users != null)
                    return new Error('ce username existe déjà');

                const password = await bcrypt.hash(args.passwords, 12);

                const val = await models.user.create({
                    username: args.username,
                    passwords: password,
                    personne: args.personne
                });
                return val;
            } catch (error) {
                console.log(error);
                return new Error('une erreur est survenue, veiller reessayer !');
            }
        },
        addVille: async (parent, args, { models, user }) => {
            try {
                // console.log(args.dateCreation + ' Z');
                if (!user)
                    return new Error("vous devez vous authentifiez d'abord");
                const ville = await models.ville.findOne({
                    where: {
                        designation: args.designation
                    }
                });

                if (ville != null)
                    return new Error('cette ville existe déjà');
                const val = await models.ville.create({
                    designation: args.designation,
                });
                return val;
            } catch (error) {
                console.log(error);
                return new Error('une erreur est survenue, veiller reessayer !');
            }
        },
        addSaison: async (parent, args, { models, user }) => {
            try {
                // console.log(args.dateCreation + ' Z');
                if (!user)
                    return new Error("vous devez vous authentifiez d'abord");
                const saison = await models.saison.findOne({
                    where: {
                        designation: args.designation
                    }
                });

                if (saison)
                    return new Error('cette saison existe déjà');
                const val = await models.saison.create({
                    designation: args.designation,
                    datedebut: args.datedebut + " Z",
                    datefin: args.datefin + " Z"
                });
                return val;
            } catch (error) {
                console.log(error);
                return new Error('une erreur est survenue, veiller reessayer !');
            }
        }
    },

};

module.exports = resolvers;