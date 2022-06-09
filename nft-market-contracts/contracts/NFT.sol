pragma solidity 0.5.16;

import "./ConvertLib.sol";

contract NFT {
	string[] nfts;
	mapping (uint => address) owners;
	mapping (address => mapping(address => mapping(uint => bool))) approves;

	event Mint(uint nftId, string nftContent, address owner);
	event SendNft(address indexed addrFrom, address indexed addrTo, uint nftId);

	function mint(string memory nft) public {
		nfts.push(nft);
		owners[nfts.length - 1] = msg.sender;
		emit Mint(nfts.length - 1, nft, msg.sender);
	}

	// 호출자의 NFT를 To에게 전송하는 함수
	function sendNft(address addrTo, uint nftId) public {
		require(msg.sender == owners[nftId]);
		owners[nftId] = addrTo;
		emit SendNft(msg.sender ,addrTo, nftId);
	}

	function getOwner(uint nftId) public view returns (address){
		return owners[nftId];
	}

	// 호출자의 NFT를 To에게 허락하는 함수
	function approve(address addrTo, uint nftId) public {
		require(msg.sender == owners[nftId]);
		approves[msg.sender][addrTo][nftId] = true;
	}

	
	// 호출자의 NFT를 To에게 허락하는 함수
	function approveNft(address addrTo, uint nftId) public {
		require(msg.sender == owners[nftId]);
		approves[msg.sender][addrTo][nftId] = true;
	}

	// 호출자에게 허락된 NFT를 Toㅇ에게 전송할 수 있게 해 주는 함수 
	// nft의 주인은 nft의 아이디로 알아낼 수 있음. 따라서 From 파라미터는 생략됨.
	function sendNftFrom(address addrTo, uint nftId) public {
		require(approves[owners[nftId]][msg.sender][nftId]); // 
		address addrFrom = owners[nftId];
		owners[nftId] = addrTo;
		approves[owners[nftId]][msg.sender][nftId] = false;
		emit SendNft(addrFrom, addrTo, nftId);
	}

	function getNft(uint nftId) public view returns (string memory) {
		return nfts[nftId];
	}
}