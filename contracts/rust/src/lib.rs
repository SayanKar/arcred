// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

/// Initializes a custom, global allocator for Rust programs compiled to WASM.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Import the Stylus SDK along with alloy primitive types for use in our program.
use stylus_sdk::prelude::*;
use alloy_primitives::{Address, U256};

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

    // pub fn borrower_to_borrower_stats(&self, borrower: Address) -> Result<BorrowerStats, Vec<u8>> {
    //     Ok(*self.borrower_to_borrower_stats.get(borrower).deref())
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
}
