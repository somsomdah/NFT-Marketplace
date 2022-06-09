pragma solidity 0.5.16;

import "./ConvertLib.sol";
import "./MetaCoin.sol";
import "./NFT.sol";


contract Market {
	mapping (uint => uint) prices;
	NFT NFTContract;
	MetaCoin MetaCoinContract;

	event Purchase(uint nftId, address indexed prevOwner);
	event Register(uint nftId, uint amount);
	event Unregister(uint nftId);

	constructor(address nftAddress, address tokenAddress) public {
		NFTContract = NFT(nftAddress);
		MetaCoinContract = MetaCoin(tokenAddress);
	}

	function getPrice(uint nftId) public view returns (uint) {
		return prices[nftId];
	}

	function purchase(uint nftId) public {

		uint price = prices[nftId];
		address prevOwner = NFTContract.getOwner(nftId);

		require (0 < price);
				
		MetaCoinContract.sendCoinFrom(msg.sender, prevOwner, price);
		NFTContract.sendNftFrom(msg.sender, nftId);
		prices[nftId] = 0;

		emit Purchase(nftId, prevOwner);
	}

	function register(uint nftId, uint amount) public {
		require(NFTContract.getOwner(nftId) == msg.sender);
		prices[nftId] = amount;
		emit Register(nftId, amount);
	}

	function unregister(uint nftId) public {
		require(NFTContract.getOwner(nftId) == msg.sender);
		prices[nftId] = 0;
		emit Unregister(nftId);
	}
}