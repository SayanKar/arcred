use ethers::{
    middleware::SignerMiddleware,
    prelude::abigen,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
    types::Address,
};
use eyre::eyre;
use std::io::{BufRead, BufReader};
use std::str::FromStr;
use std::sync::Arc;

/// Your private key file path.
const ENV_PRIV_KEY_PATH: &str = "PRIVATE_KEY";

/// Stylus RPC endpoint url.
const ENV_RPC_URL: &str = "https://stylus-testnet.arbitrum.io/rpc";

/// Deployed pragram address.
const ENV_PROGRAM_ADDRESS: &str = "0x8D7C446f719568b5e9b67F419613D93752F74DbB";

#[tokio::main]
async fn main() -> eyre::Result<()> {
    // let priv_key_path = std::env::var(ENV_PRIV_KEY_PATH)
    //     .map_err(|_| eyre!("No {} env var set", ENV_PRIV_KEY_PATH))?;
    // let rpc_url =
    //     std::env::var(ENV_RPC_URL).map_err(|_| eyre!("No {} env var set", ENV_RPC_URL))?;

    let priv_key_path = String::from(ENV_PRIV_KEY_PATH);
    let rpc_url = String::from(ENV_RPC_URL);
    let program_address = String::from(ENV_PROGRAM_ADDRESS);
    // let program_address = std::env::var(ENV_PROGRAM_ADDRESS)
    //     .map_err(|_| eyre!("No {} env var set", ENV_PROGRAM_ADDRESS))?;
    abigen!(
        Arcred,
        r#"[
            function admin() external view returns (address)
            function creditLineCooldownPeriod() external view returns (uint256)
            function consumerLoanCooldownPeriod() external view returns (uint256)
            function nextLoanId() external view returns (uint256)
            function isLender(address lender) external view returns (bool)
            function isLenderApproved(address borrower, address lender) external view returns (bool)
            function approvedLenders(uint256 index) external view returns (address)
            function registerLender(address lender) external
            function approveLender(address lender, bool approve) external
            function registerLoan(uint8 loan_type, string calldata desc, uint256 amount, address borrower) external returns (uint256)
            function closeLoan(uint256 loan_id) external
            function registerBorrowerActivity(uint256 loan_id, uint256 unsettled_amount, uint256 default_amount) external
            function getMyCreditReport() external view returns (uint256, uint256, uint256, uint256, uint256[] memory)
            function getBorrowerCreditReport(address user) external view returns (uint256, uint256, uint256, uint256, uint256[] memory)
            function init() external returns (address)
        ]"#
    );

    let provider = Provider::<Http>::try_from(rpc_url)?;
    let address: Address = program_address.parse()?;

    let privkey = read_secret_from_file(&priv_key_path)?;
    let wallet = LocalWallet::from_str(&privkey)?;
    let chain_id = provider.get_chainid().await?.as_u64();
    let client = Arc::new(SignerMiddleware::new(
        provider,
        wallet.clone().with_chain_id(chain_id),
    ));

    let arcred = Arcred::new(address, client);
    let admin = arcred.admin().call().await;
    println!("Admin = {:?}", admin);

    let _ = arcred.init().send().await?.await?;
    println!("Successfully set the admin arcred via a tx");

    let admin = arcred.admin().call().await;
    println!("Admin = {:?}", admin);
    
    Ok(())
}

fn read_secret_from_file(fpath: &str) -> eyre::Result<String> {
    let f = std::fs::File::open(fpath)?;
    let mut buf_reader = BufReader::new(f);
    let mut secret = String::new();
    buf_reader.read_line(&mut secret)?;
    Ok(secret.trim().to_string())
}
