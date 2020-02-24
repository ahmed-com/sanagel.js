const Sequelize = require('sequelize');
const db = require('../utils/db');

const User = db.define('users',{
    id : {
        type : Sequelize.INTEGER,
        autoIncrement : true,
        allowNull : false,
        primaryKey : true,
        unique : true
    },
    userName : {
        type : Sequelize.STRING,
        allowNull : false
    },
    mail : Sequelize.STRING
});

module.exports = User;