const Sequelize = require('sequelize');
const db = new Sequelize('testing','root',process.env.DBPASSWORD,{dialect: 'mysql', host : 'localhost'});

module.exports = db;