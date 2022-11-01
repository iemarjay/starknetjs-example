import {connect} from "get-starknet"
import {useRef, useState} from "react";
import {AccountInterface, Contract, ProviderInterface} from "starknet";
import {toBN} from "starknet/dist/utils/number"
import ABI from "../abis/main-abi.json"

export default function Home() {
    const [address, setAddress] = useState<string>()
    const [name, setName] = useState('')
    const [inputAddress, setInputAddress] = useState('')
    const [retrievedName, setRetrievedName] = useState('')
    const [isConnected, setIsConnected] = useState(false)

    const addressNameMapRef = useRef<AddressNameMap>();

    async function connectWallet() {
        const action = async () => {
            const mainContract = await StarknetMainContract.connectWeb3Wallet()
            addressNameMapRef.current = new AddressNameMap(mainContract);

            setAddress(mainContract.connectedAddress)
            setIsConnected(true)
        }
        await perform(action);
    }

    async function setNameFunction() {
        const action = async () => {
            await addressNameMapRef.current?.add(name)
            alert("You've successfully associated your name with this address!")
        }

        await perform(action)
    }

    async function getNameFunction() {
        const action = async () => setRetrievedName(await addressNameMapRef.current?.getNameFor(inputAddress))
        await perform(action)
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
                                <input type="text" className="input" placeholder="Enter Name"
                                       onChange={(e) => setName(e.target.value)}/>

                                <input type="submit" className="button" value="Store Name" onClick={setNameFunction}/>
                            </div>

                            <hr/>

                            <p>Insert a wallet address, to retrieve its name.</p>
                            <div className="cardForm">
                                <input type="text" className="input" placeholder="Enter Address"
                                       onChange={(e) => setInputAddress(e.target.value)}/>

                                <input type="submit" className="button" value="Get Name" onClick={getNameFunction}/>
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


interface MainContract {
    storeName(name: string): void

    getName(address: string): Promise<string>
}

class StarknetMainContract implements MainContract {
    private readonly readerContract: Contract;
    private readonly writerContract: Contract;

    private readonly provider: ProviderInterface;

    private _connectedAddress: string | undefined;

    constructor(account: AccountInterface, provider: ProviderInterface) {
        this.readerContract = new Contract(ABI, contractAddress, provider);
        this.writerContract = new Contract(ABI, contractAddress, account);
        this.provider = provider;
    }

    static async connectWeb3Wallet() {
        const starknet = await connect();
        await starknet?.enable()

        if (starknet?.account && starknet?.provider) {
            const starknetMainContract = new StarknetMainContract(starknet.account, starknet.provider);
            starknetMainContract._connectedAddress = starknet?.selectedAddress

            return starknetMainContract;
        }
    }

    get connectedAddress(): string | undefined {
        return this._connectedAddress;
    }

    public async getName(address: string) {
        const _name = await this.readerContract.getName(address)
        const bn = toBN(_name.toString());
        return Buffer.from(bn.toString(16), 'hex').toString();
    }

    public async storeName(name: string) {
        const felt = "0x" + Buffer.from(name).toString('hex');
        const { transaction_hash } = await this.writerContract.storeName(felt);
        await this.provider.waitForTransaction(transaction_hash)
    }
}

class AddressNameMap {
    private readonly contract: MainContract

    constructor(contract: MainContract) {
        this.contract = contract;
    }

    async add(name: string) {
        await this.contract.storeName(name);
    }

    async getNameFor(address: string) {
        return await this.contract.getName(address);
    }
}

async function perform(action: () => Promise<void>) {
    try {
        await action()
    } catch (e) {
        alert(e.message)
        console.error(e)
    }
}