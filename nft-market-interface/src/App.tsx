import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import Web3 from "web3";
import NftABI from "./assets/abi/NFT.json";
import MetaCoinABI from "./assets/abi/MetaCoin.json";
import MarketABI from "./assets/abi/Market.json";
import { upload } from "@testing-library/user-event/dist/upload";
import { pinFileToIPFS } from "./api/pinata";
import { getSystemErrorName } from "util";
import { Popover } from "@headlessui/react";

const marketAddr = "0x01883d3Ac6343f4c7Ce9b80C0628941d414A5a14";
const nftAddr = "0xD9e3ceC72D375FECfE175e58cD1156dc6944907D";
const coinAddr = "0xfb638E2fD721288d3aa05aE98f26C9a5121098e1";

function App() {
  const [address, setAddress] = useState("");
  const [nfts, setNfts] = useState<any[]>([]);
  const [balance, setBalance] = useState("-");
  const [amount, setAmount] = useState("0");
  const [coinReceiver, setCoinReceiver] = useState("");
  const [contract, setContract] = useState<any>({
    nft: null,
    coin: null,
    market: null,
    isConnected: false,
  });
  const [isMyPage, setIsMyPage] = useState(false);

  const connect = async () => {
    //@ts-ignore
    const addr = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAddress(addr[0]);
    console.log(addr[0]);
  };

  const mint = async () => {
    if (!address) {
      alert("Please Connect Your Wallet!");
      return;
    }
    const { IpfsHash } = await uploadImage();
    contract.web3.eth.getGasPrice(function (e: any, gas: any) {
      let _gas = String(BigInt(gas) * BigInt(2));
      contract.nft.methods
        .mint(IpfsHash)
        .send({ from: address, gasPrice: _gas })
        .on("receipt", (result: any) => {
          console.log(result);
          alert("Success!!");
        })
        .on("error", (err: any) => {
          console.log(err);
          alert("Error");
        });
      console.log(gas);
    });
  };

  const getNfts = async () => {
    let i = 0;
    const newNfts: any = [];
    while (true) {
      try {
        const hash = await contract.nft.methods.getNft(i).call();
        const price = await contract.market.methods.getPrice(i).call();
        const owner = await contract.nft.methods.getOwner(i).call();
        newNfts.push({
          id: String(i),
          hash: hash,
          price: price,
          owner: owner.toLowerCase(),
        });
        i++;
      } catch (e: any) {
        console.log(e);
        break;
      }
    }
    if (i > 0) {
      setNfts(newNfts);
    }

    console.log(newNfts);
  };

  const getBalance = () => {
    contract.coin.methods
      .getBalance(address)
      .call()
      .then((result: string) => setBalance(result));
  };

  const sendCoin = () => {
    contract.coin.methods
      .sendCoin(coinReceiver, amount)
      .send({ from: address })
      .on("receipt", (result: any) => {
        alert("Success!!");
      })
      .on("error", (err: any) => {
        console.log(err);
        alert("Error");
      });
  };

  useEffect(() => {
    // @ts-ignore
    if (typeof window.ethereum !== "undefined") {
      // @ts-ignore
      const web3 = new Web3(window.ethereum);
      //@ts-ignore
      const nftContract = new web3.eth.Contract(NftABI.abi, nftAddr);
      //@ts-ignore
      const coinContract = new web3.eth.Contract(MetaCoinABI.abi, coinAddr);
      //@ts-ignore
      const marketContract = new web3.eth.Contract(MarketABI.abi, marketAddr);
      if (address) {
        getBalance();
      }
      console.log(balance, address);
      setContract({
        nft: nftContract,
        coin: coinContract,
        market: marketContract,
        isConnected: true,
        web3: web3,
      });
      // 계정이 바뀌면 콜백 함수를 실행시키는 함수
      // @ts-ignore
      window.ethereum.on("accountsChanged", () => connect());
      // 민트 이벤트 발생 시 콜백 함수 실행 등록
      const subsMint = nftContract.events.Mint().on("data", (event: any) => {
        setNfts(
          nfts.concat({
            id: event.returnValues.nftId,
            hash: event.returnValues.nftContent,
            price: "0",
            owner: event.returnValues.owner.toLowerCase(),
          })
        );
      });
      const subsBuy = marketContract.events
        .Purchase()
        .on("data", (event: any) => {
          const index = nfts.findIndex(
            (nft) => nft.id === event.returnValues.nftId
          );
          nfts[index]["price"] = "0";
          setNfts(nfts);
          alert(
            `Congrats!! Your product <${event.returnValues.preOwner}> has just been sold!!`
          );
        });
      const subsRegister = marketContract.events
        .Register()
        .on("data", async (event: any) => {
          setNfts((nfts) =>
            nfts.map((nft) => {
              return nft.id === event.returnValues.nftId
                ? { ...nft, price: event.returnValues.amount }
                : nft;
            })
          );
        });
      const subsUnregister = marketContract.events
        .Unregister()
        .on("data", (event: any) => {
          setNfts((nfts) =>
            nfts.map((nft) => {
              return nft.id === event.returnValues.nftId
                ? { ...nft, price: "0" }
                : nft;
            })
          );
        });
      const subsSendCoin = coinContract.events
        .SendCoin({ filter: { addrFrom: address } })
        .on("data", (event: any) => {
          if (event.returnValues.addrFrom.toLowerCase() == address) {
            setBalance((prev) =>
              String(BigInt(prev) - BigInt(event.returnValues.amount))
            );
          }
        });
      const subsReceiveCoin = coinContract.events
        .SendCoin({ filter: { addrTo: address } })
        .on("data", (event: any) => {
          if (event.returnValues.addrTo.toLowerCase() === address) {
            setBalance((prev) =>
              String(BigInt(prev) + BigInt(event.returnValues.amount))
            );
          }
        });
      return () => {
        subsMint.unsubscribe((error: any, result: any) => {});
        subsBuy.unsubscribe((error: any, result: any) => {});
        subsRegister.unsubscribe((error: any, result: any) => {});
        subsUnregister.unsubscribe((error: any, result: any) => {});
        subsSendCoin.unsubscribe((error: any, result: any) => {});
        subsReceiveCoin.unsubscribe((error: any, result: any) => {});
      };
    } else {
      alert("install Wallet");
    }
  }, [address]);

  useEffect(() => {
    if (contract.isConnected) {
      getNfts();
    }
  }, [contract]);

  const init = async () => {
    //@ts-ignore
    await window.ethereum.enable();
    const chainId = 137;

    //@ts-ignore
    if (window.ethereum.networkVersion !== chainId) {
      try {
        //@ts-ignore
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: Web3.utils.toHex(chainId) }],
        });
      } catch (err: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (err.code === 4902) {
          //@ts-ignore
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainName: "Polygon Mainnet",
                chainId: Web3.utils.toHex(chainId),
                nativeCurrency: {
                  name: "MATIC",
                  decimals: 18,
                  symbol: "MATIC",
                },
                rpcUrls: ["https://polygon-rpc.com/"],
              },
            ],
          });
        }
      }
    }
  };
  useEffect(() => {
    init();
  }, []);

  const uploadImage = async () => {
    const file = document.querySelector("#imageInput") as HTMLInputElement;
    if (file?.files) {
      return await pinFileToIPFS(file.files[0]);
    } else {
      return null;
    }
  };

  return (
    <div className="App bg-black text-white font-mono min-h-screen text-sm">
      <div className="Header flex items-center justify-between bg-gray-900 border-b-2 border-white">
        <h1 className=" text-4xl text-white font-bold font-mono p-6">
          NFT Marketplace
        </h1>
        {address === "" ? (
          <button
            className="border-2 bg-blue-700 p-2 rounded-xl text-white font-medium mr-3"
            onClick={connect}
          >
            Connect
          </button>
        ) : (
          <div className="">
            <div className="flex justify-center">
              <div className="flex border-2 bg-blue-700 p-2 rounded-xl mr-3">
                <div className="">{address}</div>
              </div>
              <Popover className="relative">
                <Popover.Button className="flex border-2 bg-orange-600 p-2 rounded-xl mr-3">
                  BALANCE {balance}
                </Popover.Button>
                <Popover.Panel className="absolute z-10 bg-white p-4 rounded-xl mt-2 right-3">
                  <div className="flex justify-center">
                    <div>
                      <input
                        className="flex border-2 p-2 rounded-xl mb-3 border-gray-600 text-black"
                        type="text"
                        placeholder="To"
                        onChange={({ target }) => setCoinReceiver(target.value)}
                      />
                      <input
                        className="flex border-2 p-2 rounded-xl mb-3 border-gray-600 text-black"
                        type="text"
                        placeholder="Amount"
                        onChange={({ target }) => setAmount(target.value)}
                      />
                    </div>
                    <button
                      className=" ml-3 bg-green-800 border-2 p-2 rounded-xl mb-3 border-gray-600"
                      onClick={sendCoin}
                    >
                      Send
                    </button>
                  </div>
                </Popover.Panel>
              </Popover>
            </div>
          </div>
        )}
      </div>

      <div className="align-middle flex justify-center  mt-4">
        <div className="ml-3 bg-green-800 border-2 p-2 rounded-xl mb-3">
          <input
            type="file"
            id="imageInput"
            className="bg-white border-2 p-1 rounded-xl text-black mr-3"
          />
          <button
            onClick={mint}
            className="bg-white border-2 p-2 rounded-xl text-black"
          >
            MINT
          </button>
        </div>
      </div>

      <div className="Main">
        <div>
          <button
            onClick={() => setIsMyPage(false)}
            className={`px-4 py-1 mx-8 m-4 hover:bg-gray-500 transition-all text-2xl
            ${isMyPage ? "" : "border-b-4 border-white"}}`}
          >
            Explore
          </button>
          {address && (
            <button
              onClick={() => setIsMyPage(true)}
              className={`px-4 py-1 mx-8 my-4 hover:bg-gray-500 transition-all text-2xl
            ${isMyPage ? "border-b-4 border-white" : ""}}`}
            >
              MyPage
            </button>
          )}
        </div>

        {isMyPage ? (
          <MyPage nfts={nfts} contract={contract} address={address} />
        ) : (
          <Explore nfts={nfts} contract={contract} address={address} />
        )}
      </div>
    </div>
  );
}

const Explore = ({ nfts, contract, address }: any) => {
  const purchaseNft = (nftId: string, price: string) => {
    if (!address) {
      alert("Please Connect Your Wallet!");
      return;
    }
    contract.coin.methods
      .approveCoin(marketAddr, price)
      .send({ from: address })
      .on("receipt", (result: any) => {
        contract.market.methods
          .purchase(nftId, price)
          .send({ from: address })
          .on("receipt", (result: any) => {
            console.log(result);
            alert("Success!!");
          })
          .on("error", (err: any) => {
            console.log(err);
            alert("Error");
          });
      })
      .on("error", (err: any) => {
        console.log(err);
        alert("Error");
      });
  };

  return (
    <div className=" max-w-6xl m-auto p-10">
      <div className="flex justify-center flex-wrap">
        {nfts
          .filter((nft: any) => nft.owner !== address)
          .reverse()
          .map((nft: any) => {
            return (
              <Item
                nft={nft}
                address={address}
                purchaseNft={purchaseNft}
                registerNft={null}
                unregisterNft={null}
              />
            );
          })}
      </div>
    </div>
  );
};

const MyPage = ({ nfts, contract, address }: any) => {
  const registerNft = (nftId: string, price: string) => {
    contract.nft.methods
      .approveNft(marketAddr, nftId)
      .send({ from: address })
      .on("receipt", (result: any) => {
        contract.market.methods
          .register(nftId, price)
          .send({ from: address })
          .on("receipt", (result: any) => {
            console.log(result);
            alert("Success!!");
          })
          .on("error", (err: any) => {
            console.log(err);
            alert("Error");
          });
      })
      .on("error", (err: any) => {
        console.log(err);
        alert("Error");
      });
  };

  const unregisterNft = (nftId: string) => {
    contract.market.methods
      .unregister(nftId)
      .send({ from: address })
      .on("receipt", (result: any) => {
        console.log(result);
        alert("Success!!");
      })
      .on("error", (err: any) => {
        console.log(err);
        alert("Error");
      });
  };

  return (
    <div className=" max-w-6xl m-auto p-10">
      <div className="flex justify-center flex-wrap">
        {nfts
          .filter((nft: any) => nft.owner === address)
          .reverse()
          .map((nft: any) => {
            return (
              <Item
                nft={nft}
                address={address}
                purchaseNft={null}
                registerNft={registerNft}
                unregisterNft={unregisterNft}
              />
            );
          })}
      </div>
    </div>
  );
};

const Item = ({
  nft,
  address,
  purchaseNft,
  registerNft,
  unregisterNft,
}: any) => {
  const isOwner = nft.owner === address;
  const isOnSale = nft.price !== "0";
  return (
    <div className="p-2 m-2 w-[240px] h-[360px] border-2 border-white rounded-lg bg-gray-900">
      <div className="flex justify-center pb-3">
        <img
          className="object-contain w-[220px] h-[220px]"
          src={`https://gateway.pinata.cloud/ipfs/${nft.hash}`}
        />
      </div>
      <div className="overflow-hidden border-t-2 py-3">
        <div className=" text-left text-ellipsis whitespace-nowrap">
          {nft.hash}
        </div>
      </div>
      <div className="overflow-hidden border-t-2 pt-3">
        <div className="flex">
          <div className="">
            {nft.price === "0" ? "Not On Sale" : `Price | ${nft.price}`}
          </div>
          {isOnSale && !isOwner && (
            <button
              className="border-2 rounded-lg ml-3 px-3 hover:bg-gray-500 transition-all"
              onClick={() => purchaseNft(nft.id, nft.price)}
            >
              {`BUY`}
            </button>
          )}
          {!isOnSale && isOwner && (
            <button
              className="border-2 rounded-lg ml-3 px-3 hover:bg-gray-500 transition-all"
              onClick={() => registerNft(nft.id, prompt("Sale Price?"))}
            >
              Sell
            </button>
          )}
          {isOnSale && isOwner && (
            <button
              className="border-2 rounded-lg ml-3 px-3 hover:bg-gray-500 transition-all"
              onClick={() => unregisterNft(nft.id)}
            >
              Cancel
            </button>
          )}
        </div>
        <div className=" text-left text-ellipsis whitespace-nowrap">
          Owened By | {nft.owner}
        </div>
      </div>
    </div>
  );
};

export default App;
