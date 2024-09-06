const mqtt =require('mqtt');
var client=mqtt.connect(process.env.hostname,{clientId:process.env.clientId,password:process.env.password,username:process.env.username,keepalive:90, port:process.env.port})
client.on('connect', async function () {
            console.log("Connected to mqtt")
            client.publish("test","hello From DNY")
          })
client.on('reconnect', async function () {
            console.log("reconnecting to mqtt")
          })

module.exports = {client};