// SPDX-License-Identifier: GPL-3.0

pragma solidity >= 0.8.20 <0.9.0;

contract Arcred {

    enum LoanType {
        CREDIT_LINE,
        CONSUMER_LINE
    }

    struct LoanInfo {
        uint256 loanId;
        LoanType loanType;
        string desc;
        uint256 creationTime;
        uint256 sanctionedAmount;
        address lender;
        address borrower;
        bool isActive;
    }

    struct LoanState {
        uint256 loanId;
        uint256 unsettledAmount;
        uint256 defaultAmount;
        uint256 lastUpdated;
    }

    struct BorrowerStats {
        uint16 creditScore;
        uint256 numberOfDefaults;
        uint256 numberOfCreditLines;
        uint256 numberOfConsumerLoans;
    }

    struct CreditReport {
        BorrowerStats borrowerStats;
        uint256[] loanIds;
    }

    struct LoanData {
        LoanInfo loanInfo;
        LoanState loanState;
    }

    address public admin;
    uint256 public creditLineCooldownPeriod;
    uint256 public consumerLoanCooldownPeriod;
    uint256 public nextLoanId;
    mapping(address => uint256 []) public borrowerToLoanId;
    mapping(address => uint256 []) public lenderToLoanId;
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

    modifier isValidLender() {
        require(isLender[msg.sender], "You need to be a lender to do this operation");
        _;
    }

    modifier hasApproval(address _borrower) {
        require(isLenderApproved[_borrower][msg.sender], "You need to be a approved lender for the address to do this operation");
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

    function registerLoan(LoanType _loanType, string calldata _desc, uint256 _amount, address _borrower) isValidLender hasApproval(_borrower) public returns (uint256 loanId) {
        isLenderApproved[_borrower][msg.sender] = false;
        loanId = nextLoanId++;
        loanIdToLoanInfo[loanId] = LoanInfo(loanId, _loanType, _desc, block.timestamp, _amount, msg.sender, _borrower, true);
        lenderToLoanId[msg.sender].push(loanId);
        borrowerToLoanId[_borrower].push(loanId);
        // updateLoanStateAndBorrowerStats
        return loanId;
    }

    function closeLoan(uint256 loanId) isValidLender public {
        require(loanId < nextLoanId, "Invalid loanId");
        require(loanIdToLoanInfo[loanId].lender == msg.sender, "You need to be the lender for this loan to do this operation");
        loanIdToLoanInfo[loanId].isActive = false;
        // updateLoanStateAndBorrowerStats
    }
}
