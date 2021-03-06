var Web3 = require('./node_modules/web3/index.js');
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var SolidityCoder = require("web3/lib/solidity/coder.js");

var ip = location.host;

$.getJSON('http://' + ip  + '/getconfig/', function (data) {

    var json = JSON.stringify(data.result);
    var config = JSON.parse(json);

    var contractAddress = config.contract;
    var account = config.coinbase;
    $('#nodeName').text(config.name);
    $('#nodeType').text(config.typ);
    $('#coinbase').text(account);
    $('#contract').text(contractAddress);

    web3.eth.defaultAccount = account;

    var now = new Date();

    // Assemble function hashes
    var functionHashes = getFunctionHashes(abiArray);

    // Get hold of contract instance
    var contract = web3.eth.contract(abiArray).at(contractAddress);

    // Contract events filters
    var consEvent = contract.Consume()
    consEvent.watch(function(error, result){
      if (!error)
        var from = result.args.from==account ? "me" : result.args.from;
        $('#transactions').append('<tr><td>' + result.blockNumber +
        '</td><td>' + from +
        '</td><td>' + "" +
        '</td><td>Energy consumed : ' + result.args.energy.c.toString() + ' W</td></tr>');
    });
    var prodEvent = contract.Produce()
    prodEvent.watch(function(error, result){
      if (!error)
        var from = result.args.from==account ? "me" : result.args.from;
        $('#transactions').append('<tr><td>' + result.blockNumber +
        '</td><td>' + from +
        '</td><td>' + "" +
        '</td><td>Energy produced : ' + result.args.energy.c.toString() + ' W</td></tr>');
    });
    var buyEvent = contract.Buy()
    buyEvent.watch(function(error, result){
      if (!error)
        var from = result.args.from==account ? "me" : result.args.from;
        var to = result.args.to==account ? "me" : result.args.to;
        $('#transactions').append('<tr><td>' + result.blockNumber +
        '</td><td>' + from +
        '</td><td>' + to +
        '</td><td>Energy purchased : ' + result.args.energy.c.toString() + ' W</td></tr>');
    });

    // Update labels every second
    setInterval(function() {

      // Account balance in Ether
      var balanceWei = web3.eth.getBalance(account).toNumber();
      var balance = web3.fromWei(balanceWei, 'ether');
      $('#balance').text(balance);

      // Block infos
      var number = web3.eth.blockNumber;
      if ($('#latestBlock').text() != number)
        $('#latestBlock').text(number);

      var hash = web3.eth.getBlock(number).hash
      $('#latestBlockHash').text(hash);

      var timeStamp = web3.eth.getBlock(number).timestamp;
      var d = new Date(0);
      d.setUTCSeconds(timeStamp);
      $('#latestBlockTimestamp').text(d);

      // Contract energy balance: call (not state changing)
      var energyBalance = contract.getEnergyBalance.call();
      $('#energyBalance').text(energyBalance);

      $('#startedAt').text(now);

    }, 1000);

})

// Get function hashes

function getFunctionHashes(abi) {
  var hashes = [];
  for (var i=0; i<abi.length; i++) {
    var item = abi[i];
    if (item.type != "function") continue;
    var signature = item.name + "(" + item.inputs.map(function(input) {return input.type;}).join(",") + ")";
    var hash = web3.sha3(signature);
    console.log(item.name + '=' + hash);
    hashes.push({name: item.name, hash: hash});
  }
  return hashes;
}

function findFunctionByHash(hashes, functionHash) {
  for (var i=0; i<hashes.length; i++) {
    if (hashes[i].hash.substring(0, 10) == functionHash.substring(0, 10))
      return hashes[i].name;
  }
  return null;
}
