# DxInteracts

## Setup Instructions

#### Install dependencies
`> npm i`

#### Setup ganache
`> ganache-cli -d --mnemonic 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat' --defaultBalanceEther '500000000000000000000'`

#### Compile the contracts
`> npx truffle compile`

#### Deploy them locally
`> npx truffle migrate`

## Run our tests
`> yarn dxi-test`

#### Warning

Right now anyone can claim tokens from the dxi contracts. 
Dev branch already has functionality that fixes this, and will be merged into master soon.
