{
  "project": "EtherPulse",
  "token": {
    "name": "CoreToken",
    "symbol": "CT",
    "network": "Ethereum",
    "standard": "ERC-20",
    "solidity_version": "0.8.24",
    "decimals": 18,
    "max_supply": "100000000",
    "minting": false,
    "burning": false,
    "administrative_privileges": false,
    "treasury": {
      "type": "multisig",
      "address": "REPLACE_WITH_TREASURY_ADDRESS"
    }
  },
  "contract": {
    "filename": "CoreToken.sol",
    "license": "MIT",
    "imports": [
      "@openzeppelin/contracts/token/ERC20/ERC20.sol"
    ],
    "source": "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\n\ncontract CoreToken is ERC20 {\n    uint256 public constant MAX_SUPPLY = 100000000 * 10 ** 18;\n\n    constructor(address treasury)\n        ERC20(\"CoreToken\", \"CT\")\n    {\n        require(\n            treasury != address(0),\n            \"CoreToken: zero treasury address\"\n        );\n\n        _mint(treasury, MAX_SUPPLY);\n    }\n}"
  },
  "deployment": {
    "enabled": false,
    "target_network": "Sepolia",
    "mainnet_deployment": false
  },
  "security": {
    "fixed_supply": true,
    "zero_address_protection": true,
    "owner_minting": false,
    "owner_burning": false,
    "hidden_transfer_tax": false,
    "require_multisig_treasury": true
  }
}
