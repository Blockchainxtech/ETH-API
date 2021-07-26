const Web3 = require('web3');
const abi = require("./abi.json");

async function createAccount(req, res) {
    // Set web3
    const web3 = new Web3(
        req.body.network && req.body.network === "MAINNET" ?
            process.env.MAINNET :
            req.body.network === "RINKEBY" ?
                process.env.RINKEBY :
                process.env.ROPSTEN
    );

    try {
        let account = await web3.eth.accounts.create();
        res.status(200).send({ status: true, account });
    } catch(error) {
        res.status(500).send({ status: false, message: 'Create Account Failed' });
    }
}

async function getBalance(req, res) {
    // Set web3
    const web3 = new Web3(
        req.body.network && req.body.network === "MAINNET" ?
            process.env.MAINNET :
            req.body.network === "RINKEBY" ?
                process.env.RINKEBY :
                process.env.ROPSTEN
    );

    try {
        let balance = await web3.eth.getBalance(req.body.address);
        res.status(200).send({ status: true, balance: web3.utils.fromWei(balance, 'ether') });
    } catch(error) {
        res.status(500).send({ status: false, message: 'Get ETH Balance Failed' });
    }
}

async function getTokenBalance(req, res) {
    // Set web3
    const web3 = new Web3(
        req.body.network && req.body.network === "MAINNET" ?
            process.env.MAINNET :
            req.body.network === "RINKEBY" ?
                process.env.RINKEBY :
                process.env.ROPSTEN
    );

    try {
        // contract instance
        const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        const balance = await contract.methods.balanceOf(req.body.address).call();
        const decimals = await contract.methods.decimals().call();
        res.status(200).send({ status: true, balance: balance / 10**decimals });
    } catch(error) {
        res.status(500).send({ status: false, message: 'Get Token Balance Failed' });
    }
}

async function transfer(req, res) {
    // Set web3
    const web3 = new Web3(
        req.body.network && req.body.network === "MAINNET" ?
            process.env.MAINNET :
            req.body.network === "RINKEBY" ?
                process.env.RINKEBY :
                process.env.ROPSTEN
    );

    try {
        // Sign transaction
        let signTransaction = await web3.eth.accounts.signTransaction({
            to: req.body.to,
            value: web3.utils.toWei(req.body.amount, 'ether'),
            gas: req.body.gas || 2000000
        }, req.body.from_private_key);

        // Transaction
        let tx = await web3.eth.sendSignedTransaction(
            signTransaction.rawTransaction
        );
        
        res.status(200).send({ status: true, hash: tx.transactionHash });
    } catch (error) {
        res.status(500).send({ status: false, message: 'Transfer Failed' });
    }
}

async function transferToken(req, res) {
    // Set web3
    const web3 = new Web3(
        req.body.network && req.body.network === "MAINNET" ?
            process.env.MAINNET :
            req.body.network === "RINKEBY" ?
                process.env.RINKEBY :
                process.env.ROPSTEN
    );

    try {
        // contract instance
        const contract = await new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);
        const decimals = await contract.methods.decimals().call();
        // transfer event abi
        const transferAbi = await contract.methods.transfer(req.body.to, toFixed(req.body.amount * Math.pow(10, parseInt(decimals || 18)))).encodeABI();

        // Sign transaction
        let signTransaction = await web3.eth.accounts.signTransaction({
            to: process.env.CONTRACT_ADDRESS,
            data: transferAbi,
            gas: req.body.gas || 2000000
        }, req.body.from_private_key);

        // Transaction
        let tx = await web3.eth.sendSignedTransaction(
            signTransaction.rawTransaction
        );
        
        res.status(200).send({ status: true, hash: tx.transactionHash });
    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: 'Transfer Failed' });
    }
}

function toFixed(x) {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }
  return String(x);
}

module.exports = {createAccount, getBalance, getTokenBalance, transfer, transferToken}

