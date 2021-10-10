// Core contract of a CredSpot project.
// Has two functions: can take a SuperToken as payment for a digital good, distributing the revenue among project members,
// and can poke IDA share amounts based on the latest values from the Cred oracle.

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./open-oracle-framework/interfaces/IOpenOracleFramework.sol";

import {
    ISuperfluid,
    ISuperToken,
    ISuperApp,
    ISuperAgreement,
    SuperAppDefinitions
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";

import {
    SuperAppBase
} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

import "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IInstantDistributionAgreementV1.sol";


contract Cortex is SuperAppBase {
    uint256 purchasePrice;

    IOpenOracleFramework private oracle;
    ISuperfluid host;
    ISuperToken acceptedSuperToken;
    IInstantDistributionAgreementV1 private ida;

    mapping(address => bool) private purchasers;

    constructor(IOpenOracleFramework _oracle, ISuperfluid _host, ISuperToken _acceptedSuperToken, IInstantDistributionAgreementV1 _ida, uint256 _purchasePrice) {
        oracle = _oracle;
        host = _host;
        acceptedSuperToken = _acceptedSuperToken;
        ida = _ida;
        purchasePrice = _purchasePrice;

        uint256 configWord =
            SuperAppDefinitions.APP_LEVEL_FINAL |
            SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
            SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

        _host.registerApp(configWord);

        _host.callAgreement(
            _ida,
            abi.encodeWithSelector(
                _ida.createIndex.selector,
                _acceptedSuperToken,
                1,
                new bytes(0)
            ),
            new bytes(0)
        );
    }

    function getPurchased(address _customer) public view returns (bool) {
        return purchasers[_customer];
    }

    function purchase() public {
        acceptedSuperToken.transferFrom(msg.sender, address(this), purchasePrice);

        host.callAgreement(
            ida,
            abi.encodeWithSelector(
                ida.distribute.selector,
                acceptedSuperToken,
                1,
                purchasePrice,
                new bytes(0)
            ),
            new bytes(0)
        );

       purchasers[msg.sender] = true;
    }

    function poke(uint256[] memory _feedIds, address[] memory _addresses) public {
        string[] memory names;
        uint256[] memory prices;

        (names, , , , ) = oracle.getFeedList(_feedIds);
        (prices, , ) = oracle.getFeeds(_feedIds);

        for (uint i = 0; i < names.length; i++) {
            // TODO: verify that provided address matches the address in the oracle
            host.callAgreement(
                ida,
                abi.encodeWithSelector(
                    ida.updateSubscription.selector,
                    acceptedSuperToken,
                    1,
                    _addresses[i],
                    prices[i] / 1e9,
                    new bytes(0)
                ),
                new bytes(0)
            );
        }
    }
}