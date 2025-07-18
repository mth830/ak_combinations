import express from 'express';


const portNumber = 3000;
let server = express();
server.use(express.json())
server.get('/', (req, res) => {
  //check query for 5 items
  const { query } = req;
  const queryList = Object.keys(query);
  if (queryList.length !== 5) {
    //res.status(400).send("Not enough tags detected");
    res.send(tagData);
  }
})
server.listen(portNumber, () => console.log(`Starting Server on port: ${portNumber}`));