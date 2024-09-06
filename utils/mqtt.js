const mqtt =require('mqtt');
var client
async function  connectMQTT(){
    console.log("Strting MQTT")
    try{
        client=mqtt.connect(process.env.hostname,{clientId:process.env.clientId,password:process.env.password,username:process.env.username,keepalive:90, port:process.env.port})
        client.on('connect', async function () {
            console.log("Connected to mqtt")
            client.publish("test","hello From DNY")
          })
        client.on('reconnect', async function () {
            console.log("reconnecting to mqtt")
          })
    // mqtt.connect("tcp://io.cuekeeper.com", {clientId:"cuekeeperBot",password:"iocuekeeper",username:"a-Xfrhww8uZ^4=s-Ww+5",keepalive:90, port:1883})
    }catch(error){
        console.log(error)
    }
    
}

module.exports = {client,connectMQTT};