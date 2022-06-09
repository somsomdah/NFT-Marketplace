pragma solidity 0.5.16;

import "./ConvertLib.sol";


contract MetaCoin {
	mapping (address => uint) balances;
	mapping (address => mapping (address => uint)) approves;

	event SendCoin(address indexed addrFrom, address indexed addrTo, uint amount);

	constructor () public {
		balances[tx.origin] = 100000;
	}

	//  호출자의 돈을 전송하는 함수
	function sendCoin(address addrTo, uint amount) public {
		require (balances[msg.sender] >= amount);
		balances[msg.sender] -= amount;
		balances[addrTo] += amount;
		emit SendCoin(msg.sender, addrTo, amount);
	}

	function getBalance(address addr) public view returns(uint) {
		return balances[addr];
	}

	// 호출자의 돈을 To에게 허락하는 함수
	function approveCoin(address addrTo, uint amount) public {
		require (balances[msg.sender] >= amount);
		approves[msg.sender][addrTo] += amount;
	}

	// 호출자에게 허락된 From의 돈을 To에게 전송하는 함수
	function sendCoinFrom(address addrFrom, address addrTo, uint amount) public {
		require (approves[addrFrom][msg.sender] >= amount);
		require (balances[addrFrom] >= amount);

		approves[addrFrom][msg.sender] -= amount;
		balances[addrFrom] -=amount;
		balances[addrTo] += amount;

		emit SendCoin(addrFrom, addrTo, amount);
	}

}
