const DataLoader = require('dataloader');
const bacthLoader = require('./batchLoad');
const models = require('../models');
const loaders = {
    personneLoader: new DataLoader(keys => bacthLoader.batchPersonne(keys, models)),
    villeLoader: new DataLoader(keys => bacthLoader.batchVille(keys, models)),
}

module.exports = loaders;