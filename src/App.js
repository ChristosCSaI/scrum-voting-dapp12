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
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const loadWeb3 = async () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      window.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      window.alert('Please install MetaMask to use this DApp.');
    }
  };

  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    setAccount(accounts[0]);

    const networkId = parseInt(await web3.eth.net.getId(), 10);
    console.log('Network ID:', networkId);
    console.log('Account:', accounts[0]);

    if (networkId === 11155111) {
      console.log('Connected to Sepolia Network');
      setIsCorrectNetwork(true);
      const networkData = ScrumVoting.networks ? ScrumVoting.networks[networkId] : null;
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
    } else {
      console.log('Not connected to Sepolia Network. Current Network ID:', networkId);
      setIsCorrectNetwork(false);
    }
  };

  const vote = async (proposal) => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.vote(proposal).send({ from: account, value: Web3.utils.toWei('0.01', 'ether') });
      // Fetch updated votes after voting
      const elonVotes = await contract.methods.elonVotes().call();
      const markVotes = await contract.methods.markVotes().call();
      const samVotes = await contract.methods.samVotes().call();
      setVotes({ elon: elonVotes, mark: markVotes, sam: samVotes });
    } catch (error) {
      console.error("Error voting", error);
    }
  };

  const declareWinner = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.declareWinner().send({ from: account });
      loadBlockchainData();
    } catch (error) {
      console.error("Error declaring winner", error);
    }
  };

  const resetVoting = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.resetVoting().send({ from: account });
      loadBlockchainData();
    } catch (error) {
      console.error("Error resetting voting", error);
    }
  };

  const withdraw = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.withdraw().send({ from: account });
      loadBlockchainData();
    } catch (error) {
      console.error("Error withdrawing funds", error);
    }
  };

  const changeOwner = async (newOwner) => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.changeOwner(newOwner).send({ from: account });
      loadBlockchainData();
    } catch (error) {
      console.error("Error changing owner", error);
    }
  };

  const destroyContract = async () => {
    if (!contract) {
      console.error("Contract is not loaded");
      return;
    }
    try {
      await contract.methods.destroyContract().send({ from: account });
      loadBlockchainData();
    } catch (error) {
      console.error("Error destroying contract", error);
    }
  };

  const loadHistory = async () => {
    if (contract) {
      try {
        const historyCount = await contract.methods.historyCount().call();
        const history = [];
        for (let i = 0; i < historyCount; i++) {
          const record = await contract.methods.getHistory(i).call();
          history.push(record);
        }
        setHistory(history);
      } catch (error) {
        console.error("Error fetching history", error);
      }
    }
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

      <div className="proposals">
        <div className="proposal">
          <h2>Elon</h2>
          <img src={elonImage} alt="Elon" />
          <button onClick={() => vote('Elon')}>Vote</button>
          <p className="vote-count">Votes: {votes.elon}</p>
        </div>
        <div className="proposal">
          <h2>Mark</h2>
          <img src={markImage} alt="Mark" />
          <button onClick={() => vote('Mark')}>Vote</button>
          <p className="vote-count">Votes: {votes.mark}</p>
        </div>
        <div className="proposal">
          <h2>Sam</h2>
          <img src={samImage} alt="Sam" />
          <button onClick={() => vote('Sam')}>Vote</button>
          <p className="vote-count">Votes: {votes.sam}</p>
        </div>
      </div>

      <div className="button-container">
        <button onClick={declareWinner}>Declare Winner</button>
        <button onClick={resetVoting}>Reset</button>
        <button onClick={withdraw}>Withdraw</button>
        <button onClick={() => changeOwner(prompt('Enter new owner address:'))}>Change Owner</button>
        <button onClick={destroyContract}>Destroy</button>
        <button onClick={loadHistory}>History</button>
      </div>

      {history.length > 0 && (
        <div className="history-container">
          <h2>Voting History</h2>
          <ul>
            {history.map((record, index) => (
              <li key={index}>
                Vote ID: {record.voteId}, Winner: {record.winner}, Votes: {record.votes}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
