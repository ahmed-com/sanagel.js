# Introduction :
This is a database where you manually create a nameSpace that may resemble a table in a database like you would normally do but then your client application can dynamically Instantiate different channels or rooms of that table that will have their cache, where clients can perform CRUD operations in those channels, and subscribe for these changes, where they will be notified in real-time of changes. It also keeps track of seen/received/unseen  receipts and updates them in real time, the online/ofline status and the read/write/invite/remove authorization . I'll add a support for nested channels and push notifications.

However that nameSpace does not have to resemble a table and doesn't need to have a schema and you can directly Instantiate a couple of channels and treat them as if they are your tables. And you'd still be able to search each room/channel individually for the data you need.

# getting started :
1. download the [Client](https://github.com/ahmed-com/sanagel.js-client) and save it as *client* in the same directory of this project.
2. this project uses both **mysql** and **redis** locally, so make sure you have them on your machine.
3. read the [docs](./docs.md) for more info.