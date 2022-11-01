import {connect} from "get-starknet"
import {useState} from "react";
import {AccountInterface, Contract, ProviderInterface} from "starknet";
import {toBN} from "starknet/dist/utils/number"
import ABI from "../abis/main-abi.json"

export default function Home() {
    const [address, setAddress] = useState<string>()
    const [name, setName] = useState('')
    const [inputAddress, setInputAddress] = useState('')
    const [retrievedName, setRetrievedName] = useState('')
    const [isConnected, setIsConnected] = useState(false)

    let addressNameMap: AddressNameMap;

    async function connectWallet() {
        try {
            const starknet = await connect();
            await starknet?.enable({starknetVersion: "v4"})

            setAddress(starknet?.selectedAddress)
            setIsConnected(true)

            if (starknet?.account && starknet?.provider)
                addressNameMap = new AddressNameMap(starknet.account, starknet.provider);

        } catch (e) {
            alert(e.message)
            console.error(e)
        }
    }

    async function setNameFunction() {
        try {
            await addressNameMap.add(name)
            alert("You've successfully associated your name with this address!")
        } catch (e) {
            alert(e.message)
            console.error(e)
        }
    }

    async function getNameFunction() {
        try {
            setRetrievedName(await addressNameMap.getNameFor(inputAddress))
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
                            <button className="connect" onClick={connectWallet}>Connect wallet</button>
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

                                <input type="submit" className="button" value="Store Name" onClick={setNameFunction} />
                            </div>

                            <hr />

                            <p>Insert a wallet address, to retrieve its name.</p>
                            <div className="cardForm">
                                <input type="text" className="input" placeholder="Enter Address" onChange={(e) => setInputAddress(e.target.value)} />

                                <input type="submit" className="button" value="Get Name" onClick={getNameFunction} />
                            </div>
                            <p>Name: {retrievedName}.eth</p>
                        </div>
                    </div>
                </main>
            </header>
        </div>
    )
}

const contractAddress = "0x049e5c0e9fbb072d7f908e77e117c76d026b8daf9720fe1d74fa3309645eabce"

class AddressNameMap {
    private readonly account: AccountInterface;
    private readonly provider: ProviderInterface;
    private readonly readerContract: Contract;
    private readonly writerContract: Contract;

    constructor(account: AccountInterface, provider: ProviderInterface) {
        this.account = account;
        this.provider = provider;
        this.readerContract = new Contract(ABI, contractAddress, this.provider);
        this.writerContract = new Contract(ABI, contractAddress, this.account);
    }

    async add(name: string) {
        const nameToFelt = stringToFelt(name)

        await this.writerContract.storeName(nameToFelt)
    }

    async getNameFor(address: string) {
        const _name = await this.readerContract.getName(address)
        return feltToString(toBN(_name.toString()));
    }
}

function feltToString(felt) {
    const newStrB = Buffer.from(felt.toString(16), 'hex')
    return newStrB.toString()
}

function stringToFelt(str) {
    return "0x" + Buffer.from(str).toString('hex')
}