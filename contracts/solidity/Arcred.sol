// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.20 <0.9.0;

contract Arcred {

    // Enum to represent different types of loans
    enum LoanType {
        CREDIT_LINE,      // Credit line type
        CONSUMER_LINE     // Consumer loan type
    }

    // Struct to store information about a loan
    struct LoanInfo {
        uint256 loanId;           // Unique identifier for the loan
        LoanType loanType;        // Type of loan (credit line or consumer loan)
        string desc;              // Description of the loan
        uint256 creationTime;     // Timestamp when the loan was created
        uint256 sanctionedAmount; // Approved loan amount
        address lender;           // Address of the lender
        address borrower;         // Address of the borrower
        bool isActive;            // Flag indicating if the loan is active
    }

    // Struct to store the state of a loan
    struct LoanState {
        uint256 loanId;            // Loan ID associated with this state
        uint256 unsettledAmount;   // Unsettled amount in the loan
        uint256 defaultAmount;     // Amount defaulted in the loan
        uint256 lastUpdated;       // Timestamp of the last update to the loan state
    }

    // Struct to store statistics about a borrower's credit history
    struct BorrowerStats {
        uint256 creditScore;           // Credit score of the borrower
        uint256 numberOfDefaults;     // Number of defaults by the borrower
        uint256 numberOfCreditLines;  // Number of credit lines taken by the borrower
        uint256 numberOfConsumerLoans;// Number of consumer loans taken by the borrower
    }

    // Struct to represent a credit report
    struct CreditReport {
        BorrowerStats borrowerStats; // Borrower statistics
        uint256[] loanIds;           // List of loan IDs associated with the borrower
    }

    // Struct to combine LoanInfo and LoanState for easier retrieval
    struct LoanData {
        LoanInfo loanInfo;    // Information about the loan
        LoanState loanState;  // State of the loan
    }

    address public admin;                   // Address of the administrator
    uint256 public creditLineCooldownPeriod;// Cooldown period for credit lines
    uint256 public consumerLoanCooldownPeriod;// Cooldown period for consumer loans
    uint256 public nextLoanId;              // Counter for generating unique loan IDs

    uint256 constant defaultScore = 500;
    int256 constant creditUtilizationWeight = 40;
    int256 constant defaultedAmountWeight = -30;
    int256 constant numberOfDefaultsWeight = -30;
    int256 constant creditMixWeight = 10;
    int256 constant numberOfLoansWeight = -10;

    // Mapping: borrower address to an array of loan IDs
    mapping(address => uint256[]) public borrowerToLoanId;
    // Mapping: lender address to an array of loan IDs
    mapping(address => uint256[]) public lenderToLoanId;
    // Mapping: loan ID to LoanInfo
    mapping(uint256 => LoanInfo) public loanIdToLoanInfo;
    // Mapping: loan ID to LoanState
    mapping(uint256 => LoanState) public loanIdToLoanState;
    // Mapping: borrower address to BorrowerStats
    mapping(address => BorrowerStats) public borrowerToBorrowerStats;
    // Mapping: lender address to a boolean indicating if they are a lender
    mapping(address => bool) public isLender;
    // Mapping: borrower to lender approval status
    mapping(address => mapping (address => bool)) public isLenderApproved;
    // Array of approved lenders
    address [] public approvedLenders;

    // Constructor to initialize the contract with cooldown periods
    constructor(uint64 _creditLineCooldownPeriod, uint64 _consumerLoanCooldownPeriod) {
        admin = msg.sender;
        creditLineCooldownPeriod = _creditLineCooldownPeriod;
        consumerLoanCooldownPeriod = _consumerLoanCooldownPeriod;
        nextLoanId = 1;
    }

    // Modifier: Only allows the administrator to execute a function
    modifier onlyAdmin() {
        require(msg.sender == admin, "You need to be Admin to do this operation");
        _;
    }

    // Modifier: Requires the sender to be a registered lender
    modifier isValidLender() {
        require(isLender[msg.sender], "You need to be a lender to do this operation");
        _;
    }

    // Modifier: Requires lender approval for a specific borrower
    modifier hasApproval(address _borrower) {
        require(isLenderApproved[_borrower][msg.sender], "You need to be an approved lender for the address to do this operation");
        _;
    }

    /*
     * @dev Registers a new lender.
     * @params _lenderAddress The address of the lender to be registered.
     */
    function registerLender(address _lenderAddress) onlyAdmin public {
        require(!isLender[_lenderAddress], "Lender already approved");
        isLender[_lenderAddress] = true;
        approvedLenders.push(_lenderAddress);
    }

    /*
     * @dev Approves or disapproves a lender for a specific borrower.
     * @params _lenderAddress The address of the lender to be approved or disapproved.
     * @params approve True if approving, false if disapproving.
     */
    function approveLender(address _lenderAddress, bool approve) public {
        require(isLender[_lenderAddress], "The address provided is not a lender");
        require(isLenderApproved[msg.sender][_lenderAddress] != approve, "State already set");
        isLenderApproved[msg.sender][_lenderAddress] = approve;   
    }   

    /*
     * @dev Registers a new loan.
     * @params _loanType The type of loan (credit line or consumer loan).
     * @params _desc Description of the loan.
     * @params _amount Approved loan amount.
     * @params _borrower The address of the borrower.
     * @returns loanId The unique identifier of the new loan.
     */
    function registerLoan(LoanType _loanType, string calldata _desc, uint256 _amount, address _borrower) 
        isValidLender hasApproval(_borrower) public returns (uint256 loanId) {

        loanId = nextLoanId++;
        loanIdToLoanInfo[loanId] = LoanInfo(loanId, _loanType, _desc, block.timestamp, _amount, msg.sender, _borrower, true);
        lenderToLoanId[msg.sender].push(loanId);
        borrowerToLoanId[_borrower].push(loanId);

        initializeBorrowerStatsIfEmpty(_borrower);
        initializeLoanStateIfEmpty(loanId);

        // Update loan state and borrower stats
        if (_loanType == LoanType.CREDIT_LINE) {
            borrowerToBorrowerStats[_borrower].numberOfCreditLines++;
        } else {
            borrowerToBorrowerStats[_borrower].numberOfConsumerLoans++;
            loanIdToLoanState[loanId].unsettledAmount = _amount;
            loanIdToLoanState[loanId].lastUpdated = block.timestamp;
        }

        borrowerToBorrowerStats[_borrower].creditScore = calculateScore(_borrower, loanId);
    }

    /*
     * @dev Closes a loan.
     * @params _loanId The unique identifier of the loan to be closed.
     */
    function closeLoan(uint256 _loanId) isValidLender public {
        require(_loanId < nextLoanId, "Invalid loanId");
        require(loanIdToLoanInfo[_loanId].lender == msg.sender, "You need to be the lender for this loan to do this operation");
        loanIdToLoanInfo[_loanId].isActive = false;

        // Update loan state and borrower stats
        address borrower = loanIdToLoanInfo[_loanId].borrower;

        if (loanIdToLoanInfo[_loanId].loanType == LoanType.CREDIT_LINE) {
            borrowerToBorrowerStats[borrower].numberOfCreditLines--;
        } else {
            borrowerToBorrowerStats[borrower].numberOfConsumerLoans--;
        }

        loanIdToLoanState[_loanId].unsettledAmount = 0;
        loanIdToLoanState[_loanId].defaultAmount = 0;
        loanIdToLoanState[_loanId].lastUpdated = block.timestamp;
        borrowerToBorrowerStats[borrower].creditScore = calculateScore(borrower, _loanId);
    }

    /*
     * @dev Retrieves the credit report of the sender.
     * @returns creditReport The credit report of the sender.
     */
    function getMyCreditReport() public view returns (CreditReport memory creditReport){
        creditReport.borrowerStats = getBorrowerStats(msg.sender);
        creditReport.loanIds = borrowerToLoanId[msg.sender];
    }

    /*
     * @dev Retrieves loan data for a list of loan IDs.
     * @params _loanIds The list of loan IDs to retrieve data for.
     * @returns loanDataList An array of LoanData structures containing loan information and state.
     */
    function getLoanDataForLoanIds(uint256[] calldata _loanIds) public view returns(LoanData[] memory loanDataList) {
        loanDataList = new LoanData[](_loanIds.length);
        for(uint i = 0; i < _loanIds.length; i++) {
            uint256 loanId = _loanIds[i];
            require( loanId < nextLoanId, "Invalid loanId");
            require( loanIdToLoanInfo[loanId].borrower == msg.sender || isLenderApproved[loanIdToLoanInfo[loanId].borrower][msg.sender], 
                "Do not have permission to do this query");
            loanDataList[i] = (LoanData(loanIdToLoanInfo[loanId], loanIdToLoanState[loanId]));
        }
    }

    /*
     * @dev Retrieves the credit report of a specific borrower.
     * @params _borrower The address of the borrower.
     * @returns creditReport The credit report of the specified borrower.
     */
    function getBorrowerCreditReport(address _borrower) isValidLender hasApproval(_borrower) public view returns(CreditReport memory creditReport) {
        creditReport.borrowerStats = getBorrowerStats(_borrower);
        creditReport.loanIds = borrowerToLoanId[msg.sender];
    }

    /*
     * @dev Retrieves the borrower statistics.
     * @params _borrower The address of the borrower.
     * @returns borrowerStats The statistics of the specified borrower.
     */
    function getBorrowerStats(address _borrower) internal view returns(BorrowerStats memory) {
        if (borrowerToBorrowerStats[_borrower].creditScore == 0) {
            return BorrowerStats(500, 0, 0, 0);
        }
        return borrowerToBorrowerStats[_borrower];
    }

    /*
     * @dev Initializes borrower statistics if they are empty.
     * @params _borrower The address of the borrower.
     */
    function initializeBorrowerStatsIfEmpty(address _borrower) internal {
        if (borrowerToBorrowerStats[_borrower].creditScore == 0) {
            borrowerToBorrowerStats[_borrower] = BorrowerStats(500, 0, 0, 0);
        }
    } 

    /*
     * @dev Initializes loan state if it is empty.
     * @params _loanId The ID of the loan.
     */
    function initializeLoanStateIfEmpty(uint256 _loanId) internal {
        if (loanIdToLoanState[_loanId].loanId == 0) {
            loanIdToLoanState[_loanId] = LoanState(_loanId, 0, 0, 0);
        }
    }

    /*
     * @dev Registers borrower activity and updates loan state and borrower stats.
     * @params _loanId The ID of the loan.
     * @params _loanState The state of the loan.
     */
    function registerBorrowerActivity(uint256 _loanId, LoanState memory _loanState) isValidLender public {
        require(loanIdToLoanInfo[_loanId].lender == msg.sender, "You need to be the lender of this loan to do this operation");
        require(loanIdToLoanInfo[_loanId].isActive, "Loan is not active");

        // Check cooldown period based on the type of loan
        if (loanIdToLoanInfo[_loanId].loanType == LoanType.CREDIT_LINE) {
            require(loanIdToLoanState[_loanId].lastUpdated + creditLineCooldownPeriod <= block.timestamp, "Cooldown period not over");
        } else {
            require(loanIdToLoanState[_loanId].lastUpdated + consumerLoanCooldownPeriod <= block.timestamp, "Cooldown period not over");
        }

        address borrower = loanIdToLoanInfo[_loanId].borrower;

        loanIdToLoanState[_loanId].unsettledAmount = _loanState.unsettledAmount;
        loanIdToLoanState[_loanId].defaultAmount = _loanState.defaultAmount;        

        // Increment defaults count if applicable
        if (_loanState.defaultAmount != 0) {
            borrowerToBorrowerStats[borrower].numberOfDefaults++;
        }

        loanIdToLoanState[_loanId].lastUpdated = block.timestamp;
        borrowerToBorrowerStats[borrower].creditScore = calculateScore(borrower, _loanId);    
    }

   /*
    * @dev Calculates the credit score using a more sophisticated formula.
    * @param _borrower The address of the borrower.
    * @param loanId The ID of the loan.
    * @return The calculated credit score.
    */
    function calculateScore(address _borrower, uint256 _loanId) internal view returns (uint256 score) {


        uint256 numberOfDefaults = borrowerToBorrowerStats[_borrower].numberOfDefaults;
        uint256 normalizedDefaultedAmount = borrowerToBorrowerStats[_borrower].numberOfDefaults / 100;
        uint256 normalizedNumberOfLoans = (borrowerToBorrowerStats[_borrower].numberOfCreditLines +  borrowerToBorrowerStats[_borrower].numberOfConsumerLoans) / 10;
        uint256 creditMix = (borrowerToBorrowerStats[_borrower].numberOfConsumerLoans * 100) / (borrowerToBorrowerStats[_borrower].numberOfCreditLines +  borrowerToBorrowerStats[_borrower].numberOfConsumerLoans);
        uint256 creditUtilizationRatio = (loanIdToLoanState[_loanId].unsettledAmount * 100) / loanIdToLoanInfo[_loanId].sanctionedAmount;
        int256 currCreditUtilizationWeight = creditUtilizationWeight;
        if(loanIdToLoanInfo[_loanId].loanType == LoanType.CONSUMER_LINE) {
            currCreditUtilizationWeight = 0;
        }
        int256 creditScore = int256(defaultScore) +
            ((creditUtilizationWeight * int256(100 - creditUtilizationRatio)) / 100) +
            (defaultedAmountWeight * int256(100 - normalizedDefaultedAmount)) +
            (numberOfDefaultsWeight * int256(exp(-int256(numberOfDefaults)))) +
            (creditMixWeight * int256(creditMix)) + (numberOfLoansWeight * int256(100 - normalizedNumberOfLoans));

        if (creditScore < 300) {
            return 300;
        } else if (creditScore > 900) {
            return 900;
        }
        return uint256(creditScore);
    }


    // Helper function to calculate the exponential function e^x
    function exp(int256 x) internal pure returns (int256) {
        int256 result = 1e18; // 1 in fixed-point representation

        for (int256 i = 1; i <= 10; i++) {
            result += (result * x) / (1e18 * i);
        }
        return result;
    }
}
