const expect = require('chai').expect;
const Sequelize = require('sequelize');
const db = new Sequelize('testing','root',process.env.DBPASSWORD,{dialect: 'mysql', host : 'localhost'});
