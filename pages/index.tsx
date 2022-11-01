import {connect} from "get-starknet"
import {useState} from "react";
import {AccountInterface, Contract, ProviderInterface} from "starknet";
import { toBN } from "starknet/dist/utils/number"
import ABI from "../abis/main-abi.json"

export default function Home() {
    const [provider, setProvider] = useState<ProviderInterface>()
    const [account, setAccount] = useState<AccountInterface>()
    const [address, setAddress] = useState<string>()
    const [name, setName] = useState('')
    const [inputAddress, setInputAddress] = useState('')
    const [retrievedName, setRetrievedName] = useState('')
    const [isConnected, setIsConnected] = useState(false)

    const contractAddress = "0x049e5c0e9fbb072d7f908e77e117c76d026b8daf9720fe1d74fa3309645eabce"

    async function connectWallet() {
        try {
            const starknet = await connect();
            await starknet?.enable({starknetVersion: "v4"})

            setProvider(starknet?.provider)
            setAccount(starknet?.account)
            setAddress(starknet?.selectedAddress)
            setIsConnected(true)
        } catch (e) {
            alert(e.message)
            console.error(e)
        }
    }

    async function setNameFunction() {
        try {
            const contract = new Contract(ABI, contractAddress, account);
            const nameToFelt = stringToFelt(name)

            await contract.storeName(nameToFelt)
            alert("You've successfully associated your name with this address!")
        } catch (e) {
            alert(e.message)
            console.error(e)
        }
    }

    async function getNameFunction() {
        try {
            const contract = new Contract(ABI, contractAddress, provider)
            const _name = await contract.getName(inputAddress)
            const decoded = feltToString(toBN(_name.toString()));

            setRetrievedName(decoded)
        } catch (e) {
            alert(e.message)
            console.error(e)
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <main className="main">
                    <h1 className="title">
                        Starknet<a href="#"> ENS</a>
                    </h1>
                    {
                        isConnected ?
                            <button className="connect">{address?.slice(0, 5)}...{address?.slice(60)}</button> :
                            <button className="connect" onClick={() => connectWallet()}>Connect wallet</button>
                    }

                    <p className="description">
                        This demo app demonstrates the use of starknet.js to interact with starknet contracts
                    </p>

                    <div className="grid">
                        <div className="card">
                            <h2>Ensure to connect to Alpha-goerli! &rarr;</h2>
                            <p>What name do you want?.</p>

                            <div className="cardForm">
                                <input type="text" className="input" placeholder="Enter Name" onChange={(e) => setName(e.target.value)} />

                                <input type="submit" className="button" value="Store Name" onClick={() => setNameFunction()} />
                            </div>

                            <hr />

                            <p>Insert a wallet address, to retrieve its name.</p>
                            <div className="cardForm">
                                <input type="text" className="input" placeholder="Enter Address" onChange={(e) => setInputAddress(e.target.value)} />

                                <input type="submit" className="button" value="Get Name" onClick={() => getNameFunction()} />
                            </div>
                            <p>Name: {retrievedName}.eth</p>
                        </div>
                    </div>
                </main>
            </header>
        </div>
    )
}

function feltToString(felt) {
    const newStrB = Buffer.from(felt.toString(16), 'hex')
    return newStrB.toString()
}

function stringToFelt(str) {
    return "0x" + Buffer.from(str).toString('hex')
}