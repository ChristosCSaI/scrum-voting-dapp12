import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import ScrumVoting from './contracts/ScrumVoting.json';
import elonImage from './images/elon.jpg';
import markImage from './images/mark.jpg';
import samImage from './images/sam.jpg';
import './App.css';

const App = () => {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [balance, setBalance] = useState('');
  const [votes, setVotes] = useState({ elon: 0, mark: 0, sam: 0 });
  const [network, setNetwork] = useState('');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);

    const networkId = await web3.eth.net.getId();
    const networkName = await web3.eth.net.getNetworkType();
    setNetwork(networkName);
    setIsCorrectNetwork(networkId === 11155111); // Sepolia network ID

    if (networkId === 11155111) {
      const networkData = ScrumVoting.networks[networkId];
      if (networkData) {
        const scrumVoting = new web3.eth.Contract(ScrumVoting.abi, networkData.address);
        setContract(scrumVoting);
        const owner = await scrumVoting.methods.owner().call();
        setOwner(owner);
        const balance = await web3.eth.getBalance(scrumVoting.options.address);
        setBalance(web3.utils.fromWei(balance, 'ether'));

        // Load votes
        const elonVotes = await scrumVoting.methods.elonVotes().call();
        const markVotes = await scrumVoting.methods.markVotes().call();
        const samVotes = await scrumVoting.methods.samVotes().call();
        setVotes({ elon: elonVotes, mark: markVotes, sam: samVotes });
      } else {
        window.alert('Smart contract not deployed to detected network.');
      }
    }
  };

  const vote = async (proposal) => {
    await contract.methods.vote(proposal).send({ from: account, value: Web3.utils.toWei('0.01', 'ether') });
    loadBlockchainData();
  };

  const declareWinner = async () => {
    await contract.methods.declareWinner().send({ from: account });
    loadBlockchainData();
  };

  const resetVoting = async () => {
    await contract.methods.resetVoting().send({ from: account });
    loadBlockchainData();
  };

  const withdraw = async () => {
    await contract.methods.withdraw().send({ from: account });
    loadBlockchainData();
  };

  const changeOwner = async (newOwner) => {
    await contract.methods.changeOwner(newOwner).send({ from: account });
    loadBlockchainData();
  };

  const destroyContract = async () => {
    await contract.methods.destroyContract().send({ from: account });
    loadBlockchainData();
  };

  if (!window.ethereum) {
    return <div>Please install MetaMask to use this DApp.</div>;
  }

  if (!isCorrectNetwork) {
    return <div>Please connect to the Sepolia network in MetaMask.</div>;
  }

  return (
    <div className="app-container">
      <h1>Scrum Voting DApp</h1>
      <p>Account: {account}</p>
      <p>Contract Owner: {owner}</p>
      <p>Contract Balance: {balance} ETH</p>

      <div className="proposal">
        <h2>Elon</h2>
        <img src={elonImage} alt="Elon" />
        <button onClick={() => vote('Elon')}>Vote</button>
        <p>Votes: {votes.elon}</p>
      </div>
      <div className="proposal">
        <h2>Mark</h2>
        <img src={markImage} alt="Mark" />
        <button onClick={() => vote('Mark')}>Vote</button>
        <p>Votes: {votes.mark}</p>
      </div>
      <div className="proposal">
        <h2>Sam</h2>
        <img src={samImage} alt="Sam" />
        <button onClick={() => vote('Sam')}>Vote</button>
        <p>Votes: {votes.sam}</p>
      </div>

      <button onClick={declareWinner}>Declare Winner</button>
      <button onClick={resetVoting}>Reset</button>
      <button onClick={withdraw}>Withdraw</button>
      <button onClick={() => changeOwner(prompt('Enter new owner address:'))}>Change Owner</button>
      <button onClick={destroyContract}>Destroy</button>
    </div>
  );
};

export default App;
