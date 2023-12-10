// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Initializes a custom, global allocator for Rust programs compiled to WASM.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use alloy_primitives::U8;
/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::{prelude::*, msg, block};
use stylus_sdk::alloy_primitives::{Address, U256};

pub type CreditReport = (U256,U256,U256,U256);

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

        // LoanInfo
        mapping(uint256 => uint8) loan_id_to_loan_type;
        mapping(uint256 => string) loan_id_to_desc;
        mapping(uint256 => uint256) loan_id_to_creation_time;
        mapping(uint256 => uint256) loan_id_to_sanctioned_amount;
        mapping(uint256 => address) loan_id_to_lender;
        mapping(uint256 => address) loan_id_to_borrower;
        mapping(uint256 => bool) loan_id_to_is_active;

        // LoanState
        mapping(uint256 => uint256) loan_id_to_unsettled_amount;
        mapping(uint256 => uint256) loan_id_to_default_amount;
        mapping(uint256 => uint256) loan_id_to_last_updated;

        // BorrowerStats
        mapping(address => uint256) borrower_to_credit_score;
        mapping(address => uint256) borrower_to_number_of_defaults;
        mapping(address => uint256) borrower_to_number_of_credit_lines;
        mapping(address => uint256) borrower_to_number_of_consumer_loans;


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

        let loan_id = self.next_loan_id.get();
        self.loan_id_to_loan_type.setter(loan_id).set(U8::from(loan_type));
        self.loan_id_to_desc.setter(loan_id).set_str(desc);
        self.loan_id_to_creation_time.setter(loan_id).set(U256::from(block::timestamp()));
        self.loan_id_to_sanctioned_amount.setter(loan_id).set(amount);
        self.loan_id_to_lender.setter(loan_id).set(msg::sender());
        self.loan_id_to_borrower.setter(loan_id).set(borrower);

        self.lender_to_loan_id.setter(msg::sender()).push(loan_id); // grow?
        self.borrower_to_loan_id.setter(borrower).push(loan_id); // grow?

        self.initialize_borrower_stats_if_empty(borrower);

        // Update loan state and borrower stats
        if loan_type == 0 {
            let count = self.borrower_to_number_of_credit_lines.get(borrower);
            self.borrower_to_number_of_credit_lines.setter(borrower).set(count + U256::from(1));
        } else {
            let count = self.borrower_to_number_of_consumer_loans.get(borrower);
            self.borrower_to_number_of_consumer_loans.setter(borrower).set(count + U256::from(1));
        }

        let credit_score = self.calculate_score(borrower, loan_id);
        self.borrower_to_credit_score.setter(borrower).set(credit_score);

        Ok(loan_id)
    }

    pub fn close_loan(&mut self, loan_id: U256) -> Result<(), Vec<u8>> {
        self.is_valid_lender();
        assert!(loan_id < self.next_loan_id.get(), "Invalid loanId");
        assert_eq!(
            self.loan_id_to_lender.get(loan_id),
            msg::sender(),
            "You need to be the lender for this loan to do this operation"
        );

        self.loan_id_to_is_active.setter(loan_id).set(false);

        let borrower = self.loan_id_to_borrower.get(loan_id);

        if self.loan_id_to_loan_type.get(loan_id) == U8::ZERO {
            let count = self.borrower_to_number_of_credit_lines.get(borrower);
            self.borrower_to_number_of_credit_lines.setter(borrower).set(count - U256::from(1));
        } else {
            let count = self.borrower_to_number_of_consumer_loans.get(borrower);
            self.borrower_to_number_of_consumer_loans.setter(borrower).set(count - U256::from(1));
        }

        self.loan_id_to_last_updated.setter(loan_id).set(U256::from(block::timestamp()));

        let credit_score = self.calculate_score(borrower, loan_id);
        self.borrower_to_credit_score.setter(borrower).set(credit_score);

        Ok(())
    }

    pub fn register_borrower_activity(
        &mut self,
        loan_id: U256,
        unsettled_amount: U256,
        default_amount: U256
    ) -> Result<(), Vec<u8>> {

        assert_eq!(
            self.loan_id_to_lender.get(loan_id),
            msg::sender(),
            "You need to be the lender of this loan to do this operation"
        );

        let cooldown_period = if self.loan_id_to_loan_type.get(loan_id) == U8::ZERO {
            self.credit_line_cooldown_period.to_owned()
        } else {
            self.consumer_loan_cooldown_period.to_owned()
        };

        let last_updated = self.loan_id_to_last_updated.get(loan_id);
        assert!((last_updated + cooldown_period) <= U256::from(block::timestamp()), "Cooldown period not over");

        self.loan_id_to_unsettled_amount.setter(loan_id).set(unsettled_amount);
        self.loan_id_to_default_amount.setter(loan_id).set(default_amount);

        let borrower = self.loan_id_to_borrower.get(loan_id);
        if default_amount > U256::ZERO {
            let count = self.borrower_to_number_of_defaults.get(borrower);
            self.borrower_to_number_of_defaults.setter(borrower).set(count + U256::from(1));
        }

        self.loan_id_to_last_updated.setter(loan_id).set(U256::from(block::timestamp()));

        let credit_score = self.calculate_score(borrower, loan_id);
        self.borrower_to_credit_score.setter(borrower).set(credit_score);

        Ok(())
    }

    pub fn get_my_credit_report(&self) -> Result<CreditReport, Vec<u8>> {
        self.get_borrower_credit_report(msg::sender())
    }

    pub fn get_borrower_credit_report(&self, user: Address) -> Result<CreditReport, Vec<u8>> {
        self.has_approval(user);

        let credit_score = self.borrower_to_credit_score.get(user);
        let number_of_defaults = self.borrower_to_number_of_defaults.get(user);
        let number_of_credit_lines = self.borrower_to_number_of_credit_lines.get(user);
        let number_of_consumer_loans = self.borrower_to_number_of_consumer_loans.get(user);

        Ok((
            credit_score,
            number_of_defaults,
            number_of_credit_lines,
            number_of_consumer_loans,
        ))
    }

    pub fn init(&mut self) -> Result<Address, Vec<u8>> {
        let caller = msg::sender();
        if self.admin.get().is_zero() {
            self.admin.set(caller);
        }
        Ok(self.admin.get())
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
        if borrower != msg::sender() {
            assert_eq!(
                self.is_lender_approved(borrower, msg::sender()),
                Ok(true),
                "You need to be a approved lender for the address to do this operation"
            )
        }
    }

    fn initialize_borrower_stats_if_empty(&mut self, borrower: Address) {
        if self.borrower_to_credit_score.get(borrower) == U256::ZERO {
            self.borrower_to_credit_score.setter(borrower).set(U256::from(500));
        }
    }

    fn calculate_score(&self, borrower: Address, loan_id: U256) -> U256 {
        // let credit_utilization_weight = I256;
        // int256 constant defaultedAmountWeight = -4;
        // int256 constant numberOfDefaultsWeight = -3;
        // int256 constant creditMixWeight = 1;
        // int256 constant numberOfLoansWeight = -1;

        let current_credit_score = self.borrower_to_credit_score.get(borrower);
        let credit_score = current_credit_score;

        let lower_limit: U256 = U256::from(300);
        let higher_limit: U256 = U256::from(900);

        if credit_score <= lower_limit {
            lower_limit
        } else if credit_score >= higher_limit {
            higher_limit
        } else {
            credit_score
        }
    }
}
