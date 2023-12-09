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
        nextLoanId = 1;
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
        require(isLender[_lenderAddress], "The address provided is not a lender");
        require(isLenderApproved[msg.sender][_lenderAddress] != approve, "State already set");
        isLenderApproved[msg.sender][_lenderAddress] = approve;   
    }   

    function registerLoan(LoanType _loanType, string calldata _desc, uint256 _amount, address _borrower) isValidLender hasApproval(_borrower) public returns (uint256 loanId) {
        isLenderApproved[_borrower][msg.sender] = false;
        loanId = nextLoanId++;
        loanIdToLoanInfo[loanId] = LoanInfo(loanId, _loanType, _desc, block.timestamp, _amount, msg.sender, _borrower, true);
        lenderToLoanId[msg.sender].push(loanId);
        borrowerToLoanId[_borrower].push(loanId);
        initializeBorrowerStatsIfEmpty(_borrower);
        initializeLoanStateIfEmpty(loanId);
        // updateLoanStateAndBorrowerStats
        if( _loanType == LoanType.CREDIT_LINE) {
            borrowerToBorrowerStats[_borrower].numberOfCreditLines++;
        } else {
            borrowerToBorrowerStats[_borrower].numberOfConsumerLoans++;
            loanIdToLoanState[loanId].unsettledAmount = _amount;
            loanIdToLoanState[loanId].lastUpdated = block.timestamp;
        }
        borrowerToBorrowerStats[_borrower].creditScore = calculateScore(_borrower, loanId);

    }

    function closeLoan(uint256 _loanId) isValidLender public {
        require(_loanId < nextLoanId, "Invalid loanId");
        require(loanIdToLoanInfo[_loanId].lender == msg.sender, "You need to be the lender for this loan to do this operation");
        loanIdToLoanInfo[_loanId].isActive = false;
        // updateLoanStateAndBorrowerStats
        address borrower = loanIdToLoanInfo[_loanId].borrower;
        if( loanIdToLoanInfo[_loanId].loanType == LoanType.CREDIT_LINE) {
            borrowerToBorrowerStats[borrower].numberOfCreditLines--;
        } else {
            borrowerToBorrowerStats[borrower].numberOfConsumerLoans--;
        }
        loanIdToLoanState[_loanId].unsettledAmount = 0;
        loanIdToLoanState[_loanId].defaultAmount = 0;
        loanIdToLoanState[_loanId].lastUpdated = block.timestamp;
        borrowerToBorrowerStats[borrower].creditScore = calculateScore(borrower, _loanId);
    }

    function getMyCreditReport() public returns (CreditReport memory creditReport){
        creditReport.borrowerStats = getBorrowerStats(msg.sender);
        creditReport.loanIds = borrowerToLoanId[msg.sender];
    }

    function getLoanDataForLoanIds(uint256 [] calldata _loanIds) public view returns(LoanData[] memory loanDataList) {
        loanDataList = new LoanData[](_loanIds.length);
        for(uint i = 0; i < _loanIds.length; i++) {
            uint256 loanId = _loanIds[i];
            require( loanId < nextLoanId, "Invalid loanId");
            require( loanIdToLoanInfo[loanId].borrower == msg.sender || isLenderApproved[loanIdToLoanInfo[loanId].borrower][msg.sender], 
                "Do not have permission to do this query");
            loanDataList[i] = (LoanData(loanIdToLoanInfo[loanId], loanIdToLoanState[loanId]));
        }
    }

    function getBorrowerCreditReport(address _borrower) isValidLender hasApproval(_borrower) public returns(CreditReport memory creditReport) {
        creditReport.borrowerStats = getBorrowerStats(_borrower);
        creditReport.loanIds = borrowerToLoanId[msg.sender];
    }

    function getBorrowerStats(address _borrower) internal returns(BorrowerStats memory) {
        initializeBorrowerStatsIfEmpty(_borrower);
        return borrowerToBorrowerStats[_borrower];
    }

    function initializeBorrowerStatsIfEmpty(address _borrower) internal {
        if(borrowerToBorrowerStats[_borrower].creditScore == 0) {
            borrowerToBorrowerStats[_borrower] = BorrowerStats(500, 0, 0, 0);
        }
    } 

    function initializeLoanStateIfEmpty(uint256 _loanId) internal {
        if(loanIdToLoanState[_loanId].loanId == 0) {
            loanIdToLoanState[_loanId] = LoanState(_loanId, 0, 0, 0);
        }
    }


    function registerBorrowerActivity(uint256 _loanId, LoanState memory _loanState) isValidLender public {
        require(loanIdToLoanInfo[_loanId].lender == msg.sender, "You need to be the lender of this loan to do this operation");
        require(loanIdToLoanInfo[_loanId].isActive, "Loan is not active");
        if (loanIdToLoanInfo[_loanId].loanType == LoanType.CREDIT_LINE) {
            require(loanIdToLoanState[_loanId].lastUpdated + creditLineCooldownPeriod <= block.timestamp, "Cooldown period not over");
        } else {
            require(loanIdToLoanState[_loanId].lastUpdated + consumerLoanCooldownPeriod <= block.timestamp, "Cooldown period not over");
        }
        address borrower = loanIdToLoanInfo[_loanId].borrower;
        loanIdToLoanState[_loanId].unsettledAmount = _loanState.unsettledAmount;
        loanIdToLoanState[_loanId].defaultAmount = _loanState.defaultAmount;        
        if(_loanState.defaultAmount != 0) {
            borrowerToBorrowerStats[borrower].numberOfDefaults++;
        }
        loanIdToLoanState[_loanId].lastUpdated = block.timestamp;
        borrowerToBorrowerStats[borrower].creditScore = calculateScore(borrower, _loanId);    
    }

    function calculateScore(address _borrower, uint256 loanId) internal returns (uint16) {
        return (400);
    }
}
