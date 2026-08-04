use alloy::{
    network::EthereumWallet,
    primitives::{address, keccak256, Address, U256},
    providers::ProviderBuilder,
    signers::local::PrivateKeySigner,
    sol,
};
use std::env;
use tracing::{error, info, warn};

// ABI binding for ProofOfIntent
sol!(
    #[allow(missing_docs)]
    #[sol(rpc)]
    ProofOfIntent,
    r#"[
        {
            "type": "function",
            "name": "recordIntent",
            "inputs": [
                { "name": "_targetContract", "type": "address" },
                { "name": "_attackType",     "type": "string"  },
                { "name": "_riskScorePercentage", "type": "uint256" },
                { "name": "_intentHash",     "type": "bytes32" }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        }
    ]"#
);

const CONTRACT_ADDRESS: Address = address!("534f0DD617BCC4378B2D45135b4c700f6eec7d31");

pub async fn record_intent_on_chain(
    target_contract: &str,
    attack_type: &str,
    risk_score: f64,
    intent_summary: &str,
) {
    let private_key = match env::var("PRIVATE_KEY") {
        Ok(k) => k,
        Err(_) => {
            warn!("PRIVATE_KEY not set — skipping on-chain recording");
            return;
        }
    };

    let rpc_url = env::var("EVM_RPC_URL")
        .unwrap_or_else(|_| "https://testnet-rpc.monad.xyz".to_string());

    let signer: PrivateKeySigner = match private_key.parse() {
        Ok(s) => s,
        Err(e) => {
            error!("Failed to parse PRIVATE_KEY: {}", e);
            return;
        }
    };

    let wallet = EthereumWallet::from(signer);

    let provider = match ProviderBuilder::new()
        .wallet(wallet)
        .connect(&rpc_url)
        .await
    {
        Ok(p) => p,
        Err(e) => {
            error!("Failed to connect to RPC for on-chain recording: {}", e);
            return;
        }
    };

    let contract = ProofOfIntent::new(CONTRACT_ADDRESS, provider);

    // Derive a deterministic intent hash from summary + timestamp
    let hash_input = format!("{}:{}", intent_summary, attack_type);
    let intent_hash = keccak256(hash_input.as_bytes());

    let target_addr: Address = target_contract
        .parse()
        .unwrap_or(Address::ZERO);

    let risk_pct = U256::from((risk_score * 100.0) as u64);

    match contract
        .recordIntent(target_addr, attack_type.to_string(), risk_pct, intent_hash.into())
        .send()
        .await
    {
        Ok(pending) => {
            info!(
                "⛓️  Intent recorded on-chain | attack={} risk={}% tx={:?}",
                attack_type,
                risk_pct,
                pending.tx_hash()
            );
        }
        Err(e) => {
            // Non-fatal — dashboard still works without on-chain recording
            warn!("On-chain recordIntent failed (non-fatal): {}", e);
        }
    }
}
