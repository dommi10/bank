const LoadHash = require('lodash');

const batchsLoads = {
    batchPersonne: async (keys, { personne }) => {
        const personnes = await personne.findAll({
            raw: true,
        });
        const gc = LoadHash.groupBy(personnes, 'id');

        return keys.map(k => gc[k] || []);
    },
    batchVille: async (keys, { ville }) => {
        const villes = await ville.findAll({
            raw: true,
        });
        const gc = LoadHash.groupBy(villes, 'id');

        return keys.map(k => gc[k] || []);
    },
}

module.exports = batchsLoads;