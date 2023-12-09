// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.20 <0.9.0;

import "@openzeppelin/contracts/utils/Context.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

contract ArcredCCIP {
    // Enum to represent different types of loans
    enum LoanType {
        CREDIT_LINE,      // Credit line type
        CONSUMER_LINE     // Consumer loan type
    }

    // CCIP cross-chain message payload
    struct CCIPPayload {
        address caller;
        bytes4 func;
        bytes params;
    }

    // Struct to store the state of a loan
    struct LoanState {
        uint256 loanId;            // Loan ID associated with this state
        uint256 unsettledAmount;   // Unsettled amount in the loan
        uint256 defaultAmount;     // Amount defaulted in the loan
        uint256 lastUpdated;       // Timestamp of the last update to the loan state
    }

    IRouterClient public router;
    uint64 public destinationChainSelector;
    address public arcred;
    address public linkToken;

    constructor(address _router, uint64 _destinationChainSelector, address _arcred, address _linkToken) {
        router = IRouterClient(_router);
        destinationChainSelector = _destinationChainSelector;
        arcred = _arcred;
        linkToken = _linkToken;
    }

    function registerLender(address _lenderAddress) public {
        _executeCCIPTx(
            this.registerLender.selector, 
            abi.encode(_lenderAddress)
        );
    }

    function approveLender(address _lenderAddress, bool _approve) public {
        _executeCCIPTx(
            this.approveLender.selector, 
            abi.encode(_lenderAddress, _approve)
        );
    }

    function registerLoan(
        LoanType _loanType, 
        string memory _desc, 
        uint256 _amount, 
        address _borrower
    ) public returns (uint256 loanId) {
        _executeCCIPTx(
            this.registerLoan.selector, 
            abi.encode(_loanType, _desc, _amount, _borrower)
        );
        return 0;
    }

    function closeLoan(uint256 _loanId) public {
        _executeCCIPTx(
            this.closeLoan.selector, 
            abi.encode(_loanId)
        );
    }

    function registerBorrowerActivity(uint256 _loanId, LoanState memory _loanState) public {
        _executeCCIPTx(
            this.registerBorrowerActivity.selector, 
            abi.encode(_loanId, _loanState)
        );
    }

    function _executeCCIPTx(bytes4 _func, bytes memory _params)
        internal
        returns (bytes32 messageId)
    {
        CCIPPayload memory ccipPayload = CCIPPayload(msg.sender, _func, _params);

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(arcred),
            data: abi.encode(ccipPayload),
            tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array indicating no tokens are being sent
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 400000})),
            feeToken: linkToken // zero address indicates native asset will be used for fees
        });

        // Get the fee required to send the message
        uint256 fees = router.getFee(destinationChainSelector, evm2AnyMessage);

        LinkTokenInterface(linkToken).increaseApproval(address(router), fees);
        messageId = router.ccipSend(destinationChainSelector, evm2AnyMessage);

        // Return the message ID
        return messageId;
    }
}
