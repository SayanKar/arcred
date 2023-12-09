// SPDX-License-Identifier: GPL-3.0

pragma solidity >= 0.8.20 <0.9.0;

contract Arcred {
    struct LoanInfo {
        uint256 loanId;
        uint8 loanType;
        string desc;
        uint64 creationTime;
        uint256 sanctionedAmount;
        address lender;
        address borrower;
        bool isActive;
    }

    struct LoanState {
        uint256 loanId;
        uint256 unsettledAmount;
        uint256 defaultAmount;
        uint64 lastUpdated;
    }

    struct BorrowerStats {
        uint16 creditScore;
        uint256 numberOfDefaults;
        uint256 numberOfCreditLines;
        uint256 numberOfConsumerLoans;
    }

    address admin;
    uint64 public creditLineCooldownPeriod;
    uint64 public consumerLoanCooldownPeriod;
    uint256 public nextLoanId;
    mapping(address => uint256 []) public borrowerToCreditId;
    mapping(address => uint256 []) public lenderToCreditId;
    mapping(uint256 => LoanInfo) public loanIdToLoanInfo;
    mapping(uint256 => LoanState) public loanIdToLoanState;
    mapping(address => BorrowerStats) public borrowerToBorrowerStats;
    mapping(address => bool) public isLender;
    mapping(address => mapping (address => bool)) public isLenderApproved;
    address [] public approvedLenders;

    constructor(uint64 _creditLineCooldownPeriod, uint64 _consumerLoanCooldownPeriod) {
        admin = msg.sender;
        creditLineCooldownPeriod = _creditLineCooldownPeriod;
        consumerLoanCooldownPeriod = _consumerLoanCooldownPeriod;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "You need to be Admin to do this operation");
        _;
    }

    function registerLender(address _lenderAddress) onlyAdmin public {
        require(!isLender[_lenderAddress], "Lender already approved");
        isLender[_lenderAddress] = true;
        approvedLenders.push(_lenderAddress);
    }

    function approveLender(address _lenderAddress, bool approve) public {
        require(isLenderApproved[msg.sender][_lenderAddress] != approve, "State already set");
        isLenderApproved[msg.sender][_lenderAddress] = approve;   
    }   
}
