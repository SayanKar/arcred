// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Initializes a custom, global allocator for Rust programs compiled to WASM.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{prelude::*, msg};
use stylus_sdk::alloy_primitives::{Address, U256};

// Define the entrypoint as a Solidity storage object, The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {

    // enum LoanType {
    //     CREDIT_LINE;
    //     CONSUMER_LINE;
    // }

    pub struct LoanInfo {
        uint256 loan_id;
        uint8 loan_type; // LoanType
        string desc;
        uint256 creation_time;
        uint256 sanctioned_amount;
        address lender;
        address borrower;
        bool is_active;
    }

    pub struct LoanState {
        uint256 loan_id;
        uint256 unsettled_amount;
        uint256 default_amount;
        uint256 last_updated;
    }

    pub struct BorrowerStats {
        uint16 credit_score;
        uint256 number_of_defaults;
        uint256 number_of_credit_lines;
        uint256 number_of_consumer_loans;
    }

    // pub struct CreditReport {
    //     BorrowerStats borrower_stats;
    //     uint256[] loan_ids;
    // }

    // pub struct LoanData {
    //     LoanInfo loan_info;
    //     LoanState loan_state;
    // }

    #[entrypoint]
    pub struct Arcred {
        address admin;
        uint256 credit_line_cooldown_period;
        uint256 consumer_loan_cooldown_period;
        uint256 next_loan_id;
        mapping(address => uint256[]) borrower_to_loan_id;
        mapping(address => uint256 []) lender_to_loan_id;
        mapping(uint256 => LoanInfo) loan_id_to_loan_info;
        mapping(uint256 => LoanState) loan_id_to_loan_state;
        mapping(address => BorrowerStats) borrower_to_borrower_stats;
        mapping(address => bool) is_lender;
        mapping(address => mapping (address => bool)) is_lender_approved;
        address [] approved_lenders;
    }
}

pub type BorrowerStatsExpanded = (u16, U256, U256, U256);

impl From<BorrowerStats> for BorrowerStatsExpanded {
    fn from(borrower_stats: BorrowerStats) -> Self {
        (
            borrower_stats.credit_score.to::<u16>(),
            borrower_stats.number_of_defaults.to::<U256>(),
            borrower_stats.number_of_credit_lines.to::<U256>(),
            borrower_stats.number_of_consumer_loans.to::<U256>(),
        )
    }
}

alloy_sol_types::sol!(
    function registerLoan(uint8 _loanType, string calldata _desc, uint256 _amount, address _borrower) isValidLender hasApproval(_borrower) public returns (uint256 loanId) {
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
);

// Getters
#[external]
impl Arcred {
    pub fn admin(&self) -> Result<Address, Vec<u8>> {
        Ok(self.admin.get())
    }

    pub fn credit_line_cooldown_period(&self) -> Result<U256, Vec<u8>> {
        Ok(self.credit_line_cooldown_period.get())
    }

    pub fn consumer_loan_cooldown_period(&self) -> Result<U256, Vec<u8>> {
        Ok(self.consumer_loan_cooldown_period.get())
    }

    pub fn next_loan_id(&self) -> Result<U256, Vec<u8>> {
        Ok(self.next_loan_id.get())
    }

    // pub fn borrower_to_loan_id(&self, borrower: Address) -> Result<Vec<U256>, Vec<u8>> {
    //     Ok(self.borrower_to_loan_id.get(borrower))
    // }

    // pub fn lender_to_loan_id(&self, lender: Address) -> Result<Vec<U256>, Vec<u8>> {
    //     Ok(self.lender_to_loan_id.get(lender))
    // }

    // pub fn loan_id_to_loan_info(&self, loan_id: U256) -> Result<LoanInfo, Vec<u8>> {
    //     Ok(*self.loan_id_to_loan_info.get(loan_id).deref())
    // }

    // pub fn loan_id_to_loan_state(&self, loan_id: U256) -> Result<LoanState, Vec<u8>> {
    //     Ok(*self.loan_id_to_loan_state.get(loan_id).deref())
    // }

    pub fn borrower_to_borrower_stats(&self, borrower: Address) -> Result<BorrowerStatsExpanded, Vec<u8>> {
        let borrower_stats = unsafe {
            self.borrower_to_borrower_stats.get(borrower).into_raw()
        };

        Ok(borrower_stats.into())
    }

    pub fn is_lender(&self, lender: Address) -> Result<bool, Vec<u8>> {
        Ok(self.is_lender.get(lender))
    }

    pub fn is_lender_approved(&self, borrower: Address, lender: Address) -> Result<bool, Vec<u8>> {
        Ok(self.is_lender_approved.get(borrower).get(lender))
    }

    pub fn approved_lenders(&self, index: U256) -> Result<Address, Vec<u8>> {
        Ok(self.approved_lenders.get(index).unwrap())
    }

    pub fn register_lender(&mut self, lender: Address) -> Result<(), Vec<u8>> {
        self.only_owner();
        assert_eq!(
            self.is_lender(lender), 
            Ok(false),
            "Lender already approved"
        );

        let mut status = self.is_lender.setter(lender);
        status.set(true);

        self.approved_lenders.push(lender);
        Ok(())
    }

    pub fn approve_lender(&mut self, lender: Address, approve: bool) -> Result<(), Vec<u8>> {
        assert!(
            self.is_lender.get(lender),
            "The address provided is not a lender"
        );

        assert_eq!(
            self.is_lender_approved(msg::sender(), lender),
            Ok(approve),
            "State already set"
        );

        let mut borrower_list = self.is_lender_approved.setter(msg::sender());
        let mut status = borrower_list.setter(lender);
        status.set(approve);
        
        Ok(())
    }

    pub fn register_loan(
        &mut self,
        loan_type: u8,
        desc: String,
        amount: U256,
        borrower: Address,
    ) -> Result<U256, Vec<u8>> {
        self.is_valid_lender();
        self.has_approval(borrower);

        self.is_lender_approved.setter(borrower).insert(msg::sender(), false);

        let loan_id = self.next_loan_id.get();

        // let loan_info = LoanInfo {
        //     loan_id: loan_id,
        //     loan_type,
        //     desc,
        //     creation_time: amount,
        //     sanctioned_amount: amount,
        //     lender: msg::sender(),
        //     borrower,
        //     is_active: true,
        // };

        let setter1 = self.loan_id_to_loan_state.setter(loan_id);

        todo!()
    }
}

// Modifiers
impl Arcred {
    fn only_owner(&self) {
        assert_eq!(
            msg::sender(), 
            self.admin.get(), 
            "You need to be Admin to do this operation"
        )
    }

    fn is_valid_lender(&self) {
        assert!(
            self.is_lender.get(msg::sender()),
            "You need to be a lender to do this operation"
        )
    }

    fn has_approval(&self, borrower: Address) {
        assert_eq!(
            self.is_lender_approved(borrower, msg::sender()),
            Ok(true),
            "You need to be a approved lender for the address to do this operation"
        )
    }
}
