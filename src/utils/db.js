const Sequelize = require('sequelize');
const db = new Sequelize('ans','root',process.env.DBPASSWORD,{dialect: 'mysql', host : 'localhost'});

module.exports = db;